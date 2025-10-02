import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { prompt } from '../ai/claudeAgent';

interface LocatorAssessment {
  specFile: string;
  locator: string;
  score: number;
  issues: string[];
  suggestedImprovement?: string;
  elementPurpose?: string;
  context?: string;
  aiAnalysis?: string;
}

interface ExtractedLocator {
  locator: string;
  purpose?: string;
  context?: string;
  lineNumber?: number;
}

export class LocatorQualityAssessor {
  private assessments: Map<string, LocatorAssessment[]> = new Map();

  async assessTestFile(page: Page, filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const locators = this.extractLocators(content);
    const fileName = path.basename(filePath);
    
    console.log(`  Found ${locators.length} locators in ${fileName}`);
    
    for (const locator of locators) {
      const assessment = await this.assessLocator(page, locator.locator, {
        specFile: fileName,
        elementPurpose: locator.purpose,
        context: locator.context
      });
      
      if (!this.assessments.has(fileName)) {
        this.assessments.set(fileName, []);
      }
      this.assessments.get(fileName)?.push(assessment);
    }
  }

  private async assessLocator(
    page: Page, 
    locatorString: string, 
    context: { specFile: string; elementPurpose?: string; context?: string }
  ): Promise<LocatorAssessment> {
    const assessment: LocatorAssessment = {
      specFile: context.specFile,
      locator: locatorString,
      score: 10,
      issues: [],
      elementPurpose: context.elementPurpose,
      context: context.context
    };

    try {
      // Basic locator validation
      const resilienceCheck = this.checkResilience(locatorString);
      if (!resilienceCheck.passed) {
        assessment.score -= 3;
        assessment.issues.push(resilienceCheck.reason);
        assessment.suggestedImprovement = resilienceCheck.suggestion;
      }

      // Test locator performance and existence
      try {
        const startTime = performance.now();
        const element = page.locator(locatorString).first();
        await element.waitFor({ state: 'attached', timeout: 5000 });
        const duration = performance.now() - startTime;
        
        if (duration > 1000) {
          assessment.score -= 1;
          assessment.issues.push(`Slow locator (${Math.round(duration)}ms)`);
        }

        // Check locator specificity
        const count = await page.locator(locatorString).count();
        if (count > 1) {
          assessment.score -= 2;
          assessment.issues.push(`Matches ${count} elements (should be unique)`);
        } else if (count === 0) {
          assessment.score -= 5;
          assessment.issues.push('Element not found on current page');
        }
      } catch (error) {
        assessment.score -= 4;
        assessment.issues.push(`Element not accessible: ${error.message}`);
      }

      // Check for anti-patterns
      const antiPatterns = this.detectAntiPatterns(locatorString);
      if (antiPatterns.length > 0) {
        assessment.score -= antiPatterns.length;
        assessment.issues.push(...antiPatterns);
      }

      // Get AI analysis for problematic locators
      if (assessment.score < 8) {
        assessment.aiAnalysis = await this.getAIAnalysis(locatorString, assessment.issues, context);
      }

      return assessment;

    } catch (error) {
      assessment.score = 0;
      assessment.issues.push(`Critical error: ${error.message}`);
      return assessment;
    }
  }

  private async getAIAnalysis(
    locator: string, 
    issues: string[], 
    context: { specFile: string; elementPurpose?: string; context?: string }
  ): Promise<string> {
    try {
      const systemPrompt = `You are a senior test automation engineer specializing in Playwright locator optimization. 
      Analyze the provided locator and suggest specific improvements focusing on resilience, maintainability, and performance.`;

      const userPrompt = `
## Locator Analysis Request

**Locator:** \`${locator}\`
**Test File:** ${context.specFile}
**Element Purpose:** ${context.elementPurpose || 'Unknown'}
**Current Issues:** ${issues.join(', ')}

## Analysis Needed:
1. **Root Cause:** Why is this locator problematic?
2. **Improved Locator:** Provide a better alternative using Playwright best practices
3. **Strategy:** Explain the locator strategy (data-testid, role, text, etc.)
4. **Code Example:** Show the exact replacement code

## Locator Priority (use in order):
1. \`data-testid\` attributes
2. \`getByRole()\` with accessible names
3. \`getByText()\` for unique text
4. \`getByPlaceholder()\` for inputs
5. CSS selectors as last resort

Provide a concise, actionable response in markdown format.`;

      const response = await prompt({
        input: userPrompt,
        system: systemPrompt,
        maxTokens: 800,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest'
      });

      return response.response;
    } catch (error) {
      return `AI analysis failed: ${error.message}`;
    }
  }

  private extractLocators(content: string): ExtractedLocator[] {
    const locators: ExtractedLocator[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Extract page.locator() calls
      const locatorMatch = line.match(/page\.locator\(['"](.*?)['"]\)/);
      if (locatorMatch) {
        locators.push({
          locator: locatorMatch[1],
          purpose: this.extractPurposeFromLine(line, lines, index),
          context: `Line ${index + 1}`,
          lineNumber: index + 1
        });
      }

      // Extract page.getBy* calls
      const getByMatch = line.match(/page\.(getBy(?:Role|Text|Label|Placeholder|AltText|Title|TestId))\(([^)]+)\)/);
      if (getByMatch) {
        locators.push({
          locator: `${getByMatch[1]}(${getByMatch[2]})`,
          purpose: this.extractPurposeFromLine(line, lines, index),
          context: `Line ${index + 1}`,
          lineNumber: index + 1
        });
      }

      // Extract CSS selectors in waitForSelector
      const waitForMatch = line.match(/waitForSelector\(['"](.*?)['"]/);
      if (waitForMatch) {
        locators.push({
          locator: waitForMatch[1],
          purpose: this.extractPurposeFromLine(line, lines, index),
          context: `Line ${index + 1} (waitForSelector)`,
          lineNumber: index + 1
        });
      }
    });

    return locators;
  }

  private extractPurposeFromLine(line: string, lines: string[], index: number): string {
    // Look for comments above the locator
    for (let i = index - 1; i >= Math.max(0, index - 3); i--) {
      const commentLine = lines[i].trim();
      if (commentLine.startsWith('//')) {
        return commentLine.replace('//', '').trim();
      }
    }
    
    // Extract purpose from the line itself
    if (line.includes('click')) return 'Click action';
    if (line.includes('fill')) return 'Fill input';
    if (line.includes('expect')) return 'Assertion';
    if (line.includes('waitFor')) return 'Wait for element';
    
    return 'Unknown purpose';
  }

  private checkResilience(locator: string) {
    if (locator.includes('nth=') || locator.match(/\[\d+\]/)) {
      return {
        passed: false,
        reason: 'Uses index-based selection (brittle)',
        suggestion: 'Use data-testid or semantic selectors instead'
      };
    }

    if (locator.includes('text=') && locator.length > 100) {
      return {
        passed: false,
        reason: 'Overly specific text matching',
        suggestion: 'Use partial text matching or data attributes'
      };
    }

    if (locator.split(' ').length > 5) {
      return {
        passed: false,
        reason: 'Complex selector chain',
        suggestion: 'Simplify using data-testid or role-based selectors'
      };
    }

    return { passed: true };
  }

  private detectAntiPatterns(locator: string): string[] {
    const issues: string[] = [];
    
    if (locator.startsWith('xpath=') || locator.includes('//')) {
      issues.push('Avoid XPath selectors - use Playwright locators instead');
    }
    
    if (locator.includes('!important')) {
      issues.push('Invalid CSS syntax in locator');
    }
    
    if (locator.split('>').length > 3) {
      issues.push('Overly nested CSS selector');
    }
    
    if (locator.includes('iframe')) {
      issues.push('Use frameLocator() instead of iframe selectors');
    }

    if (locator.match(/\.(btn|button|input|form)/)) {
      issues.push('Generic class names may be unstable');
    }
    
    return issues;
  }

  generateReport(): string {
    let report = '# Locator Quality Assessment Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    let totalScore = 0;
    let totalAssessments = 0;
    let criticalIssues = 0;

    this.assessments.forEach((assessments, specFile) => {
      const avgScore = assessments.reduce((sum, a) => sum + Math.max(0, a.score), 0) / assessments.length;
      const fileIssues = assessments.filter(a => a.score < 6).length;
      
      report += `## ${specFile} (Score: ${avgScore.toFixed(1)}/10)\n\n`;
      
      if (fileIssues > 0) {
        report += `⚠️ **${fileIssues} locators need attention**\n\n`;
      }
      
      report += '| Locator | Purpose | Score | Issues | AI Recommendation |\n';
      report += '|---------|---------|-------|--------|------------------|\n';
      
      assessments.forEach(assessment => {
        totalScore += Math.max(0, assessment.score);
        totalAssessments++;
        if (assessment.score < 6) criticalIssues++;
        
        const scoreEmoji = assessment.score >= 8 ? '✅' : assessment.score >= 6 ? '⚠️' : '❌';
        
        report += `| ${scoreEmoji} \`${this.truncate(assessment.locator, 30)}\` | `;
        report += `${this.truncate(assessment.elementPurpose || 'Unknown', 15)} | `;
        report += `${assessment.score}/10 | `;
        report += `${assessment.issues.slice(0, 2).join('; ')} | `;
        
        if (assessment.aiAnalysis) {
          const firstLine = assessment.aiAnalysis.split('\n')[0].replace(/[#*]/g, '');
          report += `${this.truncate(firstLine, 40)} |\n`;
        } else {
          report += `${assessment.suggestedImprovement || 'N/A'} |\n`;
        }
      });
      
      report += '\n';
    });

    const averageScore = totalAssessments > 0 ? (totalScore / totalAssessments).toFixed(1) : '0';
    
    report += `## Summary\n\n`;
    report += `- **Overall Score:** ${averageScore}/10\n`;
    report += `- **Total Locators:** ${totalAssessments}\n`;
    report += `- **Critical Issues:** ${criticalIssues}\n`;
    report += `- **Needs Improvement:** ${totalAssessments - this.getGoodLocators()}\n\n`;
    
    if (criticalIssues > 0) {
      report += `### 🚨 Priority Actions\n`;
      report += `${criticalIssues} locators have critical issues and should be fixed immediately.\n\n`;
    }
    
    return report;
  }

  private getGoodLocators(): number {
    let count = 0;
    this.assessments.forEach(assessments => {
      count += assessments.filter(a => a.score >= 8).length;
    });
    return count;
  }

  getFeedbackForAI(): string {
    const feedback = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.assessments.size,
        totalLocators: Array.from(this.assessments.values()).flat().length,
        averageScore: this.calculateAverageScore(),
        criticalIssues: this.getCriticalIssuesCount()
      },
      assessments: Array.from(this.assessments.entries()).map(([specFile, assessments]) => ({
        specFile,
        assessments: assessments.map(a => ({
          originalLocator: a.locator,
          issues: a.issues,
          suggestedImprovement: a.suggestedImprovement,
          score: a.score,
          elementPurpose: a.elementPurpose,
          context: a.context,
          aiAnalysis: a.aiAnalysis
        }))
      }))
    };
    
    return JSON.stringify(feedback, null, 2);
  }

  private calculateAverageScore(): number {
    const allAssessments = Array.from(this.assessments.values()).flat();
    if (allAssessments.length === 0) return 0;
    return allAssessments.reduce((sum, a) => sum + Math.max(0, a.score), 0) / allAssessments.length;
  }

  private getCriticalIssuesCount(): number {
    return Array.from(this.assessments.values()).flat().filter(a => a.score < 6).length;
  }

  private truncate(str: string, maxLength: number): string {
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }
}

export default LocatorQualityAssessor;

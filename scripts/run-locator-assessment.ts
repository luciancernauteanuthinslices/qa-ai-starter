import { chromium } from 'playwright';
import { LocatorQualityAssessor } from './assess-locators';
import { prompt } from '../ai/claudeAgent';
import * as path from 'path';
import * as fs from 'fs';

interface AssessmentConfig {
  testDir: string;
  outputDir: string;
  baseUrl: string;
  authFile?: string;
}

class AssessmentRunner {
  private config: AssessmentConfig;

  constructor(config: AssessmentConfig) {
    this.config = config;
  }

  async runFullAssessment(): Promise<void> {
    console.log('🔍 Starting Locator Quality Assessment...');
    
    // Ensure output directory exists
    fs.mkdirSync(this.config.outputDir, { recursive: true });
    
    // Initialize browser and assessor
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const assessor = new LocatorQualityAssessor();
    
    try {
      // Load authentication if provided
      if (this.config.authFile && fs.existsSync(this.config.authFile)) {
        console.log(`🔐 Loading authentication from ${this.config.authFile}`);
        const authData = JSON.parse(fs.readFileSync(this.config.authFile, 'utf-8'));
        
        // Handle Playwright storage state format
        if (authData.cookies && Array.isArray(authData.cookies)) {
          await page.context().addCookies(authData.cookies);
        }
        if (authData.origins && Array.isArray(authData.origins)) {
          for (const origin of authData.origins) {
            if (origin.localStorage) {
              await page.addInitScript((storage) => {
                for (const [key, value] of Object.entries(storage)) {
                  localStorage.setItem(key, String(value));
                }
              }, origin.localStorage);
            }
          }
        }
      }
      
      // Navigate to application
      console.log(`🌐 Navigating to ${this.config.baseUrl}...`);
      await page.goto(this.config.baseUrl, { waitUntil: 'networkidle' });
      
      // Find and process test files
      const testFiles = this.getTestFiles();
      console.log(`📁 Found ${testFiles.length} test files to assess`);
      
      for (const file of testFiles) {
        console.log(`📝 Assessing ${path.basename(file)}...`);
        await assessor.assessTestFile(page, file);
      }
      
      // Generate reports
      await this.generateReports(assessor);
      
      // Run AI improvement suggestions
      await this.generateImprovementSuggestions(assessor);
      
    } catch (error) {
      console.error('❌ Assessment failed:', error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private getTestFiles(): string[] {
    if (!fs.existsSync(this.config.testDir)) {
      throw new Error(`Test directory not found: ${this.config.testDir}`);
    }
    
    return fs.readdirSync(this.config.testDir)
      .filter(file => (file.endsWith('.spec.ts') || file.endsWith('.spec.js')) && !file.includes('.temp'))
      .map(file => path.join(this.config.testDir, file));
  }

  private async generateReports(assessor: LocatorQualityAssessor): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Generate markdown report
    const reportPath = path.join(this.config.outputDir, `locator-assessment-${timestamp}.md`);
    const report = assessor.generateReport();
    fs.writeFileSync(reportPath, report);
    console.log(`📊 Assessment report saved: ${reportPath}`);
    
    // Generate JSON feedback for AI
    const feedbackPath = path.join(this.config.outputDir, `ai-feedback-${timestamp}.json`);
    const feedback = assessor.getFeedbackForAI();
    fs.writeFileSync(feedbackPath, feedback);
    console.log(`🤖 AI feedback data saved: ${feedbackPath}`);
    
    // Generate summary
    const summary = this.generateSummary(JSON.parse(feedback));
    console.log('\n' + '='.repeat(60));
    console.log('📈 ASSESSMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(summary);
    console.log('='.repeat(60));
  }

  private generateSummary(feedback: any): string {
    const { summary } = feedback;
    const scoreEmoji = summary.averageScore >= 8 ? '🟢' : summary.averageScore >= 6 ? '🟡' : '🔴';
    
    return `
${scoreEmoji} Overall Score: ${summary.averageScore.toFixed(1)}/10
📁 Files Assessed: ${summary.totalFiles}
🎯 Total Locators: ${summary.totalLocators}
⚠️  Critical Issues: ${summary.criticalIssues}
📈 Success Rate: ${((summary.totalLocators - summary.criticalIssues) / summary.totalLocators * 100).toFixed(1)}%

${summary.criticalIssues > 0 ? '🚨 Action Required: ' + summary.criticalIssues + ' locators need immediate attention' : '✅ All locators are in good condition'}`;
  }

  private async generateImprovementSuggestions(assessor: LocatorQualityAssessor): Promise<void> {
    console.log('\n🤖 Generating AI improvement suggestions...');
    
    try {
      const feedback = JSON.parse(assessor.getFeedbackForAI());
      const criticalIssues = this.extractCriticalIssues(feedback);
      
      if (criticalIssues.length === 0) {
        console.log('✅ No critical issues found - skipping AI analysis');
        return;
      }
      
      const systemPrompt = `You are a senior test automation engineer. Analyze the locator assessment results and provide actionable improvement recommendations. Focus on the most critical issues first.`;
      
      const userPrompt = `
# Locator Assessment Results

## Critical Issues Found: ${criticalIssues.length}

${criticalIssues.map((issue, index) => `
### Issue ${index + 1}: ${issue.file}
- **Locator:** \`${issue.locator}\`
- **Score:** ${issue.score}/10
- **Issues:** ${issue.issues.join(', ')}
- **Purpose:** ${issue.purpose}
`).join('\n')}

## Analysis Request:
1. **Priority Ranking:** Rank these issues by impact on test stability
2. **Root Causes:** Identify common patterns in the failing locators
3. **Specific Fixes:** Provide exact replacement code for each critical locator
4. **Prevention:** Suggest guidelines to prevent these issues in future

Please provide a structured response with actionable recommendations.`;

      const response = await prompt({
        input: userPrompt,
        system: systemPrompt,
        maxTokens: 2000,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest'
      });

      // Save AI recommendations
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const recommendationsPath = path.join(this.config.outputDir, `ai-recommendations-${timestamp}.md`);
      fs.writeFileSync(recommendationsPath, response.response);
      
      console.log(`🎯 AI recommendations saved: ${recommendationsPath}`);
      console.log('\n📋 Key Recommendations:');
      console.log('-'.repeat(40));
      
      // Extract and display key points
      const lines = response.response.split('\n');
      const keyPoints = lines.filter(line => 
        line.includes('**') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')
      ).slice(0, 5);
      
      keyPoints.forEach(point => {
        console.log(`• ${point.replace(/\*\*/g, '').trim()}`);
      });
      
    } catch (error) {
      console.error('⚠️ AI analysis failed:', error.message);
    }
  }

  private extractCriticalIssues(feedback: any): Array<{
    file: string;
    locator: string;
    score: number;
    issues: string[];
    purpose: string;
  }> {
    const criticalIssues: Array<{
      file: string;
      locator: string;
      score: number;
      issues: string[];
      purpose: string;
    }> = [];
    
    feedback.assessments.forEach((fileAssessment: any) => {
      fileAssessment.assessments.forEach((assessment: any) => {
        if (assessment.score < 6) {
          criticalIssues.push({
            file: fileAssessment.specFile,
            locator: assessment.originalLocator,
            score: assessment.score,
            issues: assessment.issues,
            purpose: assessment.elementPurpose || 'Unknown'
          });
        }
      });
    });
    
    return criticalIssues.sort((a, b) => a.score - b.score); // Worst scores first
  }
}

// Main execution
async function main() {
  const config: AssessmentConfig = {
    testDir: path.join(process.cwd(), 'tests', 'e2e', 'generated'),
    outputDir: path.join(process.cwd(), 'reports', 'locator-assessment'),
    baseUrl: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',
    authFile: path.join(process.cwd(), '.auth', 'admin.json')
  };
  
  const runner = new AssessmentRunner(config);
  
  try {
    await runner.runFullAssessment();
    console.log('\n🎉 Assessment completed successfully!');
    console.log('📁 Check the reports/locator-assessment/ directory for detailed results');
  } catch (error) {
    console.error('\n💥 Assessment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { AssessmentRunner, AssessmentConfig };

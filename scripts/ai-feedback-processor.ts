import { prompt } from '../ai/claudeAgent';
import * as fs from 'fs';
import * as path from 'path';

interface UserCorrection {
  originalLocator: string;
  correctedLocator: string;
  reasoning: string;
  specFile: string;
  timestamp: string;
}

interface LearningData {
  corrections: UserCorrection[];
  patterns: {
    commonMistakes: string[];
    preferredStrategies: string[];
    antiPatterns: string[];
  };
  metadata: {
    totalCorrections: number;
    lastUpdated: string;
    version: string;
  };
}

class AIFeedbackProcessor {
  private learningDataPath: string;
  private learningData: LearningData;

  constructor(learningDataPath?: string) {
    this.learningDataPath = learningDataPath || path.join(process.cwd(), '.ai-learning-data.json');
    this.learningData = this.loadLearningData();
  }

  private loadLearningData(): LearningData {
    try {
      if (fs.existsSync(this.learningDataPath)) {
        return JSON.parse(fs.readFileSync(this.learningDataPath, 'utf-8'));
      }
    } catch (error) {
      console.warn('Could not load learning data:', error.message);
    }
    
    return {
      corrections: [],
      patterns: {
        commonMistakes: [],
        preferredStrategies: [],
        antiPatterns: []
      },
      metadata: {
        totalCorrections: 0,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  private saveLearningData(): void {
    try {
      this.learningData.metadata.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.learningDataPath, JSON.stringify(this.learningData, null, 2));
    } catch (error) {
      console.warn('Could not save learning data:', error.message);
    }
  }

  async recordUserCorrection(correction: UserCorrection): Promise<void> {
    this.learningData.corrections.push(correction);
    this.learningData.metadata.totalCorrections++;
    
    // Analyze patterns from the correction
    await this.analyzeCorrection(correction);
    
    this.saveLearningData();
    console.log(`✅ Recorded correction for ${correction.specFile}`);
  }

  private async analyzeCorrection(correction: UserCorrection): Promise<void> {
    try {
      const systemPrompt = `You are analyzing user corrections to test locators to identify patterns and improve future recommendations. Extract key insights from the correction.`;
      
      const userPrompt = `
# Locator Correction Analysis

**Original Locator:** \`${correction.originalLocator}\`
**Corrected Locator:** \`${correction.correctedLocator}\`
**User Reasoning:** ${correction.reasoning}
**File:** ${correction.specFile}

## Analysis Request:
1. **Pattern Identification:** What pattern does this correction represent?
2. **Strategy Used:** What locator strategy did the user prefer?
3. **Mistake Category:** What type of mistake was the original locator?
4. **Learning Point:** What should be remembered for future recommendations?

Respond with a JSON object containing:
- "mistake_pattern": string describing the mistake
- "preferred_strategy": string describing the preferred approach
- "anti_pattern": string describing what to avoid
- "learning_point": string with the key takeaway

Example:
{
  "mistake_pattern": "Using index-based selectors",
  "preferred_strategy": "data-testid attributes",
  "anti_pattern": "nth() selectors",
  "learning_point": "Always prefer data-testid over positional selectors"
}`;

      const response = await prompt({
        input: userPrompt,
        system: systemPrompt,
        maxTokens: 500,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest'
      });

      // Parse AI response and update patterns
      try {
        const analysis = JSON.parse(response.response);
        
        if (analysis.mistake_pattern && !this.learningData.patterns.commonMistakes.includes(analysis.mistake_pattern)) {
          this.learningData.patterns.commonMistakes.push(analysis.mistake_pattern);
        }
        
        if (analysis.preferred_strategy && !this.learningData.patterns.preferredStrategies.includes(analysis.preferred_strategy)) {
          this.learningData.patterns.preferredStrategies.push(analysis.preferred_strategy);
        }
        
        if (analysis.anti_pattern && !this.learningData.patterns.antiPatterns.includes(analysis.anti_pattern)) {
          this.learningData.patterns.antiPatterns.push(analysis.anti_pattern);
        }
        
      } catch (parseError) {
        console.warn('Could not parse AI analysis response');
      }
      
    } catch (error) {
      console.warn('Pattern analysis failed:', error.message);
    }
  }

  async processAssessmentFeedback(feedbackPath: string): Promise<string> {
    const feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
    
    const systemPrompt = `You are a senior test automation engineer with access to historical learning data. 
    Use the provided learning patterns to give more accurate and personalized locator recommendations.
    
    ## Historical Learning Data:
    **Common Mistakes:** ${this.learningData.patterns.commonMistakes.join(', ')}
    **Preferred Strategies:** ${this.learningData.patterns.preferredStrategies.join(', ')}
    **Anti-Patterns:** ${this.learningData.patterns.antiPatterns.join(', ')}
    **Total Corrections:** ${this.learningData.metadata.totalCorrections}`;

    const userPrompt = `
# Locator Assessment Feedback Analysis

## Assessment Results:
${JSON.stringify(feedback, null, 2)}

## Analysis Request:
Based on the assessment results and historical learning data, provide:

1. **Priority Issues:** Rank the most critical locator problems
2. **Specific Fixes:** Exact replacement code for each problematic locator
3. **Pattern Recognition:** Which historical patterns apply to these issues?
4. **Prevention Guidelines:** How to avoid these issues in future test creation
5. **Code Examples:** Working examples of improved locators

## Response Format:
Use markdown with clear sections and code blocks. Focus on actionable recommendations that align with the historical learning patterns.`;

    try {
      const response = await prompt({
        input: userPrompt,
        system: systemPrompt,
        maxTokens: 2000,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest'
      });

      // Save the analysis
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const analysisPath = path.join(path.dirname(feedbackPath), `ai-analysis-${timestamp}.md`);
      fs.writeFileSync(analysisPath, response.response);
      
      console.log(`🤖 AI analysis saved to: ${analysisPath}`);
      return response.response;
      
    } catch (error) {
      console.error('AI feedback processing failed:', error.message);
      throw error;
    }
  }

  async generateImprovementPlan(assessmentResults: any): Promise<string> {
    const criticalIssues = this.extractCriticalIssues(assessmentResults);
    
    if (criticalIssues.length === 0) {
      return '✅ No critical issues found. All locators are in good condition.';
    }

    const systemPrompt = `You are creating an improvement plan for test locators. Use historical learning data to provide targeted recommendations.
    
    ## Learning Context:
    - Previous corrections: ${this.learningData.metadata.totalCorrections}
    - Common mistakes: ${this.learningData.patterns.commonMistakes.join(', ')}
    - Preferred strategies: ${this.learningData.patterns.preferredStrategies.join(', ')}`;

    const userPrompt = `
# Locator Improvement Plan Request

## Critical Issues (${criticalIssues.length}):
${criticalIssues.map((issue, i) => `
${i + 1}. **${issue.file}**
   - Locator: \`${issue.locator}\`
   - Score: ${issue.score}/10
   - Issues: ${issue.issues.join(', ')}
`).join('')}

Create a step-by-step improvement plan with:
1. **Immediate Actions** (critical fixes)
2. **Implementation Steps** (how to apply fixes)
3. **Validation Process** (how to test improvements)
4. **Prevention Measures** (avoid future issues)

Include specific code examples and prioritize based on impact.`;

    try {
      const response = await prompt({
        input: userPrompt,
        system: systemPrompt,
        maxTokens: 1500,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest'
      });

      return response.response;
    } catch (error) {
      console.error('Improvement plan generation failed:', error.message);
      return 'Failed to generate improvement plan. Please check the logs.';
    }
  }

  private extractCriticalIssues(assessmentResults: any): Array<{
    file: string;
    locator: string;
    score: number;
    issues: string[];
  }> {
    const criticalIssues: Array<{
      file: string;
      locator: string;
      score: number;
      issues: string[];
    }> = [];
    
    if (assessmentResults.assessments) {
      assessmentResults.assessments.forEach((fileAssessment: any) => {
        fileAssessment.assessments.forEach((assessment: any) => {
          if (assessment.score < 6) {
            criticalIssues.push({
              file: fileAssessment.specFile,
              locator: assessment.originalLocator,
              score: assessment.score,
              issues: assessment.issues
            });
          }
        });
      });
    }
    
    return criticalIssues.sort((a, b) => a.score - b.score);
  }

  getLearningStats(): {
    totalCorrections: number;
    commonMistakes: string[];
    preferredStrategies: string[];
    lastUpdated: string;
  } {
    return {
      totalCorrections: this.learningData.metadata.totalCorrections,
      commonMistakes: this.learningData.patterns.commonMistakes,
      preferredStrategies: this.learningData.patterns.preferredStrategies,
      lastUpdated: this.learningData.metadata.lastUpdated
    };
  }

  exportLearningData(): string {
    return JSON.stringify(this.learningData, null, 2);
  }
}

// CLI interface for recording corrections
async function recordCorrection() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log(`
Usage: npm run record-correction <original> <corrected> <reasoning> <file>

Example:
npm run record-correction "page.locator('.btn')" "page.getByRole('button', { name: 'Submit' })" "More resilient role-based selector" "login.spec.ts"
    `);
    process.exit(1);
  }

  const [original, corrected, reasoning, file] = args;
  const processor = new AIFeedbackProcessor();
  
  await processor.recordUserCorrection({
    originalLocator: original,
    correctedLocator: corrected,
    reasoning: reasoning,
    specFile: file,
    timestamp: new Date().toISOString()
  });

  console.log('✅ Correction recorded successfully!');
  
  const stats = processor.getLearningStats();
  console.log(`📊 Learning Stats: ${stats.totalCorrections} corrections, ${stats.commonMistakes.length} patterns identified`);
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  recordCorrection().catch(console.error);
}

export { AIFeedbackProcessor, UserCorrection, LearningData };

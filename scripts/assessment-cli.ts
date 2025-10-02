#!/usr/bin/env node

import { AssessmentRunner } from './run-locator-assessment';
import { AIFeedbackProcessor } from './ai-feedback-processor';
import * as path from 'path';
import * as fs from 'fs';

interface CLIOptions {
  command: string;
  args: string[];
}

class AssessmentCLI {
  private parseArgs(): CLIOptions {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    return { command, args: args.slice(1) };
  }

  async run(): Promise<void> {
    const { command, args } = this.parseArgs();

    switch (command) {
      case 'assess':
        await this.runAssessment();
        break;
      case 'correct':
        await this.recordCorrection(args);
        break;
      case 'analyze':
        await this.analyzeResults(args[0]);
        break;
      case 'stats':
        await this.showStats();
        break;
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }

  private async runAssessment(): Promise<void> {
    console.log('🔍 Starting Locator Quality Assessment...\n');
    
    const config = {
      testDir: path.join(process.cwd(), 'tests', 'e2e', 'generated'),
      outputDir: path.join(process.cwd(), 'reports', 'locator-assessment'),
      baseUrl: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',
      authFile: path.join(process.cwd(), '.auth', 'admin.json')
    };

    const runner = new AssessmentRunner(config);
    await runner.runFullAssessment();
  }

  private async recordCorrection(args: string[]): Promise<void> {
    if (args.length < 4) {
      console.log(`
❌ Missing arguments for correction recording.

Usage: npm run assess:cli correct <original> <corrected> <reasoning> <file>

Example:
npm run assess:cli correct "page.locator('.btn')" "page.getByRole('button', { name: 'Submit' })" "More resilient role-based selector" "login.spec.ts"
      `);
      return;
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

  private async analyzeResults(feedbackFile?: string): Promise<void> {
    const processor = new AIFeedbackProcessor();
    
    if (!feedbackFile) {
      // Find the most recent feedback file
      const reportsDir = path.join(process.cwd(), 'reports', 'locator-assessment');
      if (!fs.existsSync(reportsDir)) {
        console.log('❌ No assessment reports found. Run assessment first.');
        return;
      }
      
      const files = fs.readdirSync(reportsDir)
        .filter(f => f.startsWith('ai-feedback-') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        console.log('❌ No feedback files found. Run assessment first.');
        return;
      }
      
      feedbackFile = path.join(reportsDir, files[0]);
      console.log(`📁 Using latest feedback file: ${files[0]}`);
    }

    console.log('🤖 Analyzing assessment results with AI...');
    const analysis = await processor.processAssessmentFeedback(feedbackFile);
    
    console.log('\n📋 AI Analysis Summary:');
    console.log('='.repeat(50));
    
    // Show first few lines of analysis
    const lines = analysis.split('\n');
    const summary = lines.slice(0, 15).join('\n');
    console.log(summary);
    
    if (lines.length > 15) {
      console.log('\n... (full analysis saved to reports directory)');
    }
  }

  private async showStats(): Promise<void> {
    const processor = new AIFeedbackProcessor();
    const stats = processor.getLearningStats();
    
    console.log('\n📊 AI Learning Statistics');
    console.log('='.repeat(40));
    console.log(`Total Corrections: ${stats.totalCorrections}`);
    console.log(`Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
    console.log(`\nCommon Mistakes (${stats.commonMistakes.length}):`);
    stats.commonMistakes.forEach((mistake, i) => {
      console.log(`  ${i + 1}. ${mistake}`);
    });
    console.log(`\nPreferred Strategies (${stats.preferredStrategies.length}):`);
    stats.preferredStrategies.forEach((strategy, i) => {
      console.log(`  ${i + 1}. ${strategy}`);
    });
    
    // Show recent assessment results if available
    const reportsDir = path.join(process.cwd(), 'reports', 'locator-assessment');
    if (fs.existsSync(reportsDir)) {
      const reports = fs.readdirSync(reportsDir)
        .filter(f => f.startsWith('locator-assessment-') && f.endsWith('.md'))
        .sort()
        .reverse();
      
      if (reports.length > 0) {
        console.log(`\n📈 Latest Assessment: ${reports[0]}`);
        
        // Try to extract summary from the latest report
        try {
          const reportPath = path.join(reportsDir, reports[0]);
          const reportContent = fs.readFileSync(reportPath, 'utf-8');
          const summaryMatch = reportContent.match(/## Summary\n\n(.*?)\n\n/s);
          if (summaryMatch) {
            console.log('\nLatest Results:');
            console.log(summaryMatch[1]);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
  }

  private showHelp(): void {
    console.log(`
🔍 Locator Assessment CLI

Usage: npm run assess:cli <command> [options]

Commands:
  assess                    Run full locator quality assessment
  correct <args>           Record a user correction for AI learning
  analyze [feedback-file]  Analyze assessment results with AI
  stats                    Show learning statistics and recent results
  help                     Show this help message

Examples:
  npm run assess:cli assess
  npm run assess:cli correct "page.locator('.btn')" "page.getByRole('button', { name: 'Submit' })" "More resilient" "login.spec.ts"
  npm run assess:cli analyze
  npm run assess:cli stats

Environment Variables:
  BASE_URL                 Application URL for testing (default: orangehrm demo)
  CLAUDE_API_KEY          Claude AI API key for analysis
  ANTHROPIC_API_KEY       Alternative to CLAUDE_API_KEY

Files Generated:
  reports/locator-assessment/  Assessment reports and AI analysis
  .ai-learning-data.json      AI learning data from corrections
    `);
  }
}

// Run CLI
const cli = new AssessmentCLI();
cli.run().catch(error => {
  console.error('❌ CLI Error:', error.message);
  process.exit(1);
});

export default AssessmentCLI;

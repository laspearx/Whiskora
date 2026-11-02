import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

/** Minimal event ledger: preserves which cases started, even if the runtime exits. */
export default class VaccineMockReporter implements Reporter {
  constructor(private options: { outputFile: string }) {
    mkdirSync(dirname(options.outputFile), { recursive: true });
  }

  private write(event: string, data: object) {
    appendFileSync(this.options.outputFile, `${JSON.stringify({ time: new Date().toISOString(), event, ...data })}\n`);
  }

  private identify(test: TestCase) {
    return { id: test.id, project: test.parent.project()?.name, title: test.title };
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.write('run-begin', { workers: config.workers, cases: suite.allTests().map(test => this.identify(test)) });
  }

  onTestBegin(test: TestCase, result: TestResult) {
    this.write('case-begin', { ...this.identify(test), worker: result.workerIndex });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.write('case-end', { ...this.identify(test), status: result.status, durationMs: result.duration });
  }

  onEnd(result: FullResult) {
    this.write('run-end', { status: result.status });
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { ConfigService } from '@nestjs/config';
import { DataService } from '../data/data.service';
import { QueryService } from '../data/query.service';
import { OrmService } from '../orm/orm.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job, JobExecutionContext, StepJobHandler, TaskJobHandler } from './job.model';

describe('JobService', () => {
  let jobService: JobService;
  let mockDataService: any;
  let mockQueryService: any;
  let mockConfigService: any;
  let mockEventEmitter: any;
  let mockOrmService: any;
  let dbJobs: Map<string, Job>;

  beforeEach(async () => {
    dbJobs = new Map<string, Job>();

    mockDataService = {
      save: jest.fn().mockImplementation((name, entity) => {
        return Promise.resolve({
          entity: { ...entity, id: entity.id || 'job-123', created_at: entity.created_at || new Date() },
        });
      }),
    };

    mockQueryService = {
      findOne: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('sync'),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockOrmService = {
      sequelize: {
        transaction: jest.fn().mockImplementation((cb) => cb({})),
        query: jest.fn().mockImplementation((sql: string, options: any) => {
          const replacements = options?.replacements || {};

          // SELECT pg_advisory_xact_lock
          if (sql.includes('pg_advisory_xact_lock')) {
            return Promise.resolve([]);
          }

          // UPDATE ... SET status = 'Stopped' ... RETURNING
          if (sql.includes(`SET status = 'Stopped'`)) {
            const idOrName = replacements.idOrName;
            const matched = Array.from(dbJobs.values()).find(
              j => (j.id === idOrName || j.name === idOrName) && (j.status === 'Submitted' || j.status === 'Processing')
            );
            if (matched) {
              matched.status = 'Stopped';
              matched.status_message = replacements.statusMessage || 'Job stopped by user';
              matched.updated_at = new Date();
              return Promise.resolve([{ ...matched }]);
            }
            return Promise.resolve([]);
          }

          // UPDATE ... SET status = 'Processing' ... RETURNING
          if (sql.includes(`SET status = 'Processing'`)) {
            const job = dbJobs.get(replacements.id);
            if (job && (job.status === 'Submitted' || job.status === 'Processing')) {
              job.status = 'Processing';
              job.status_message = null;
              job.updated_at = new Date();
              return Promise.resolve([{ ...job }]);
            }
            return Promise.resolve([]);
          }

          // UPDATE ... SET step_index = ... WHERE id = :id AND status = 'Processing' RETURNING
          if (sql.includes(`SET step_index = COALESCE(:stepIndex`)) {
            const job = dbJobs.get(replacements.id);
            if (job && job.status === 'Processing') {
              if (replacements.stepIndex !== null && replacements.stepIndex !== undefined) job.step_index = replacements.stepIndex;
              if (replacements.stepCount !== null && replacements.stepCount !== undefined) job.step_count = replacements.stepCount;
              if (replacements.statusMessage !== null && replacements.statusMessage !== undefined) job.status_message = replacements.statusMessage;
              if (replacements.duration !== null && replacements.duration !== undefined) job.duration = replacements.duration;
              if (replacements.data !== null && replacements.data !== undefined) job.data = replacements.data;
              if (replacements.resultSummary !== null && replacements.resultSummary !== undefined) job.result_summary = replacements.resultSummary;
              job.updated_at = new Date();
              return Promise.resolve([{ ...job }]);
            }
            return Promise.resolve([]);
          }

          // UPDATE ... SET status = 'Completed' ... WHERE id = :id AND status = 'Processing' RETURNING
          if (sql.includes(`SET status = 'Completed'`)) {
            const job = dbJobs.get(replacements.id);
            if (job && job.status === 'Processing') {
              job.status = 'Completed';
              if (replacements.stepIndex !== null && replacements.stepIndex !== undefined) job.step_index = replacements.stepIndex;
              if (replacements.duration !== null && replacements.duration !== undefined) job.duration = replacements.duration;
              if (replacements.data !== null && replacements.data !== undefined) job.data = replacements.data;
              if (replacements.resultSummary !== null && replacements.resultSummary !== undefined) job.result_summary = replacements.resultSummary;
              job.updated_at = new Date();
              return Promise.resolve([{ ...job }]);
            }
            return Promise.resolve([]);
          }

          // UPDATE ... SET status = 'Error'
          if (sql.includes(`SET status = 'Error'`)) {
            const job = dbJobs.get(replacements.id);
            if (job && (job.status === 'Submitted' || job.status === 'Processing')) {
              job.status = 'Error';
              job.status_message = replacements.errorMessage;
              if (replacements.duration !== null && replacements.duration !== undefined) job.duration = replacements.duration;
              if (replacements.data !== null && replacements.data !== undefined) job.data = replacements.data;
              job.updated_at = new Date();
              return Promise.resolve([{ ...job }]);
            }
            return Promise.resolve([]);
          }

          // SELECT ... FROM "Job" WHERE id = :id
          if (sql.includes(`WHERE id = :id`)) {
            const job = dbJobs.get(replacements.id);
            return Promise.resolve(job ? [{ ...job }] : []);
          }

          // SELECT ... FROM "Job" WHERE name = :name
          if (sql.includes(`WHERE name = :name`)) {
            const matched = Array.from(dbJobs.values())
              .filter(j => j.name === replacements.name)
              .sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            return Promise.resolve(matched.map(j => ({ ...j })));
          }

          return Promise.resolve([]);
        }),
        model: jest.fn().mockReturnValue({
          create: jest.fn().mockImplementation((entity) => {
            const record = { ...entity };
            dbJobs.set(record.id, record);
            return Promise.resolve(record);
          }),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: OrmService, useValue: mockOrmService },
        { provide: DataService, useValue: mockDataService },
        { provide: QueryService, useValue: mockQueryService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    jobService = module.get<JobService>(JobService);
  });

  it('should register and execute a task job with progress reporting', async () => {
    const taskJob: TaskJobHandler = {
      type: 'task',
      getSummary: jest.fn().mockResolvedValue({ total: 10 }),
      execute: async (ctx?: JobExecutionContext) => {
        if (ctx) {
          await ctx.updateProgress(1, 2, 'Phase 1 in progress');
          await ctx.updateProgress(2, 2, 'Phase 2 in progress');
          ctx.setSummary({ finished: true });
        }
        return { finished: true };
      },
    };

    jobService.registerJob('custom_task', taskJob);
    expect(jobService.getJobList()).toContain('custom_task');

    const summary = await jobService.getJobSummary('custom_task');
    expect(summary).toEqual({ total: 10 });

    const jobRecord: Job = {
      id: 'job-123',
      name: 'custom_task',
      status: 'Submitted',
      data: null,
      step_index: 0,
      step_count: 2,
      duration: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const executed = await jobService.executeJob('job-123');
    expect(executed.status).toEqual('Completed');
    expect(executed.step_index).toEqual(2);
    expect(executed.step_count).toEqual(2);
  });

  it('should stop task job execution when status is changed to Stopped in database during updateProgress', async () => {
    let callCount = 0;
    const taskJob: TaskJobHandler = {
      type: 'task',
      execute: async (ctx?: JobExecutionContext) => {
        if (ctx) {
          await ctx.updateProgress(1, 10, 'Step 1');
          callCount++;
          if (callCount === 1) {
            // Concurrent stop from another process/thread
            await jobService.stopJob('job-task-stop-1');
          }
          await ctx.updateProgress(2, 10, 'Step 2');
          await ctx.updateProgress(3, 10, 'Step 3');
        }
        return { finished: true };
      },
    };

    jobService.registerJob('stopping_task', taskJob);

    const jobRecord: Job = {
      id: 'job-task-stop-1',
      name: 'stopping_task',
      status: 'Submitted',
      data: null,
      step_index: 0,
      step_count: 10,
      duration: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const executed = await jobService.executeJob('job-task-stop-1');
    expect(executed.status).toEqual('Stopped');
    expect(executed.status_message).toEqual('Job stopped by user');
  });

  it('should preserve Stopped status for task job when stopped before completion save', async () => {
    const taskJob: TaskJobHandler = {
      type: 'task',
      execute: async () => {
        // Concurrent stop right before task finishes
        await jobService.stopJob('job-task-stop-2');
        return { done: true };
      },
    };

    jobService.registerJob('task_stop_before_completion', taskJob);

    const jobRecord: Job = {
      id: 'job-task-stop-2',
      name: 'task_stop_before_completion',
      status: 'Submitted',
      data: null,
      step_index: 0,
      step_count: 1,
      duration: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const executed = await jobService.executeJob('job-task-stop-2');
    expect(executed.status).toEqual('Stopped');
  });

  it('should not execute a job that is already in Stopped status', async () => {
    const stepJob: StepJobHandler = {
      type: 'step',
      executeStep: jest.fn(),
    };
    jobService.registerJob('already_stopped_job', stepJob);

    const jobRecord: Job = {
      id: 'job-stopped-already',
      name: 'already_stopped_job',
      status: 'Stopped',
      data: null,
      step_index: 5,
      step_count: 10,
      duration: 50,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const executed = await jobService.executeJob('job-stopped-already');
    expect(executed.status).toEqual('Stopped');
    expect(stepJob.executeStep).not.toHaveBeenCalled();
  });

  it('should register and execute a step job with default chunk size 1 and persist data updates', async () => {
    const executedSteps: { stepIdx: number; chunkSize?: number }[] = [];
    const stepJob: StepJobHandler = {
      type: 'step',
      executeStep: async (job: Job, stepIdx: number, chunkSize?: number) => {
        executedSteps.push({ stepIdx, chunkSize });
        const data = JSON.parse(job.data || '{}');
        data.items = data.items || [];
        data.items.push(stepIdx);
        job.data = JSON.stringify(data);
      },
      onComplete: async (job: Job) => {
        const data = JSON.parse(job.data || '{}');
        data.completed = true;
        job.data = JSON.stringify(data);
      },
    };

    jobService.registerJob('step_job', stepJob);

    const jobRecord: Job = {
      id: 'job-456',
      name: 'step_job',
      status: 'Submitted',
      data: '{}',
      step_index: 0,
      step_count: 3,
      duration: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const executed = await jobService.executeJob('job-456');
    expect(executed.status).toEqual('Completed');
    expect(executedSteps).toEqual([
      { stepIdx: 0, chunkSize: 1 },
      { stepIdx: 1, chunkSize: 1 },
      { stepIdx: 2, chunkSize: 1 },
    ]);
    expect(JSON.parse(executed.data)).toEqual({ items: [0, 1, 2], completed: true });

    // Verify database record has updated data
    const dbJob = dbJobs.get('job-456');
    expect(JSON.parse(dbJob.data)).toEqual({ items: [0, 1, 2], completed: true });
  });

  it('should execute a step job with custom chunk size', async () => {
    const executedSteps: { stepIdx: number; chunkSize?: number }[] = [];
    const chunkStepJob: StepJobHandler = {
      type: 'step',
      chunkSize: 50,
      executeStep: async (job: Job, stepIdx: number, chunkSize?: number) => {
        executedSteps.push({ stepIdx, chunkSize });
      },
    };

    jobService.registerJob('chunk_step_job', chunkStepJob);

    const jobRecord: Job = {
      id: 'job-789',
      name: 'chunk_step_job',
      status: 'Submitted',
      data: null,
      step_index: 0,
      step_count: 150,
      chunk_size: 50,
      duration: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const executed = await jobService.executeJob('job-789');
    expect(executed.status).toEqual('Completed');
    expect(executedSteps).toEqual([
      { stepIdx: 0, chunkSize: 50 },
      { stepIdx: 50, chunkSize: 50 },
      { stepIdx: 100, chunkSize: 50 },
    ]);
  });

  it('should stop job execution when status is changed to Stopped in database concurrently', async () => {
    const executedSteps: number[] = [];

    const stoppingStepJob: StepJobHandler = {
      type: 'step',
      chunkSize: 10,
      executeStep: async (job: Job, stepIdx: number) => {
        executedSteps.push(stepIdx);
        // Simulate concurrent stop call from another thread/process after first step
        if (stepIdx === 0) {
          await jobService.stopJob('job-stop-1');
        }
      },
    };

    jobService.registerJob('stopping_job', stoppingStepJob);

    const jobRecord: Job = {
      id: 'job-stop-1',
      name: 'stopping_job',
      status: 'Submitted',
      data: null,
      step_index: 0,
      step_count: 50,
      chunk_size: 10,
      duration: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const executed = await jobService.executeJob('job-stop-1');
    expect(executed.status).toEqual('Stopped');
    // Only first chunk (step 0) should have executed before halting
    expect(executedSteps).toEqual([0]);
  });

  it('should mark job as stopped via stopJob', async () => {
    const jobRecord: Job = {
      id: 'job-stop-2',
      name: 'some_job',
      status: 'Processing',
      data: null,
      step_index: 10,
      step_count: 50,
      chunk_size: 10,
      duration: 100,
      created_at: new Date(),
      updated_at: new Date(),
    };
    dbJobs.set(jobRecord.id, { ...jobRecord });

    const stopped = await jobService.stopJob('job-stop-2');
    expect(stopped.status).toEqual('Stopped');
    expect(stopped.status_message).toEqual('Job stopped by user');
  });

  it('should filter jobs based on showInBatchUI', () => {
    const batchJob: TaskJobHandler = {
      type: 'task',
      showInBatchUI: () => true,
      execute: async () => {},
    };

    const hiddenJob: StepJobHandler = {
      type: 'step',
      showInBatchUI: () => false,
      executeStep: async () => {},
    };

    jobService.registerJob('batch_visible', batchJob);
    jobService.registerJob('hidden_job', hiddenJob);

    expect(jobService.getJobList(false)).toContain('batch_visible');
    expect(jobService.getJobList(false)).not.toContain('hidden_job');

    expect(jobService.getJobList(true)).toContain('batch_visible');
    expect(jobService.getJobList(true)).toContain('hidden_job');
  });
});

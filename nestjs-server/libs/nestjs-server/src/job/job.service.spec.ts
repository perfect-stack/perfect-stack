import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { ConfigService } from '@nestjs/config';
import { DataService } from '../data/data.service';
import { QueryService } from '../data/query.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job, JobExecutionContext, StepJobHandler, TaskJobHandler } from './job.model';

describe('JobService', () => {
  let jobService: JobService;
  let mockDataService: any;
  let mockQueryService: any;
  let mockConfigService: any;
  let mockEventEmitter: any;

  beforeEach(async () => {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: ConfigService, useValue: mockConfigService },
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

    mockQueryService.findOne.mockResolvedValue(jobRecord);

    const executed = await jobService.executeJob('job-123');
    expect(executed.status).toEqual('Completed');
    expect(executed.step_index).toEqual(2);
    expect(executed.step_count).toEqual(2);
    expect(mockDataService.save).toHaveBeenCalled();
  });

  it('should register and execute a step job', async () => {
    const executedSteps: number[] = [];
    const stepJob: StepJobHandler = {
      type: 'step',
      executeStep: async (job: Job, stepIdx: number) => {
        executedSteps.push(stepIdx);
      },
      onComplete: async (job: Job) => {
        job.data = JSON.stringify({ completed: true });
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

    mockQueryService.findOne.mockResolvedValue(jobRecord);

    const executed = await jobService.executeJob('job-456');
    expect(executed.status).toEqual('Completed');
    expect(executedSteps).toEqual([0, 1, 2]);
    expect(JSON.parse(executed.data)).toEqual({ completed: true });
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

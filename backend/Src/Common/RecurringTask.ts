/**
 * Represents a recurring task.
 * Rescheduling will be canceled, if exceptions throws.
 */
export abstract class RecurringTask {
    private isRunning = false;
    private isTaskRunning = false;
    private timer!: NodeJS.Timeout;
    private resolveCb: (() => void) | null = null;
    public get IsRunning() { return this.isRunning; }
    public constructor(private period: number) { }
    public async Start() {
        if (!this.isRunning) {
            this.isRunning = true;
            await this.ScheduleNext();
        }
    }
    public async Stop() {
        if (this.isRunning) {
            this.isRunning = false;
            clearTimeout(this.timer);
        }
        return this.isTaskRunning ? new Promise(r => this.resolveCb = r) : Promise.resolve();
    }
    public abstract async Task(): Promise<void>;
    public abstract OnAbort(e: Error): void;
    private async ScheduleNext() {
        this.isTaskRunning = true;
        try {
            await this.Task();

            this.isTaskRunning = false;

            if (this.resolveCb !== null) {
                this.resolveCb();
                this.resolveCb = null;
            }

            if (this.isRunning)
                this.timer = setTimeout(() => this.ScheduleNext(), this.period);
        } catch (e) {
            this.isTaskRunning = false;
            this.isRunning = false;
            this.OnAbort(e);
        }
    }
}

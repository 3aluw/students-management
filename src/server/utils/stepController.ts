
// ========== Handle multi steps workflow and its error handling ==========
/**
 * Represents a step in a multi-step workflow, including its name, the function to run, and an optional condition for execution.
 */
type Step = {
    name: string;
    run: () => void;
    when?: () => boolean;
};
/**
 * Represents the result of a workflow step, including its name, status, and any error that occurred.
 */
type StepResult = {
    name: string;
    status: "ran" | "skipped" | "failed";
    error?: unknown;
};

/**
 * Custom error class for handling errors in multi-step workflows, containing details about the failed step and all previous steps
 */
class StepError extends Error {
    constructor(
        public step: string,
        public originalError: unknown,
        public stepResults: StepResult[],
    ) {
        super(`فشلت الخطوة: ${step}`, { cause: originalError });
    }
}
/**
 * handles multi-step workflows and their error handling.
 * @param steps - The steps to run.
 * @param eager - Whether to throw at the first error.
 * @throws StepError containing details about the failed step and all previous steps' results.
 */
export function runSteps(steps: Step[], eager: boolean = true) {
    const stepResults: StepResult[] = [];
    for (const step of steps) {
        if (step.when && !step.when()) {
            stepResults.push({ name: step.name, status: "skipped" });
            continue;
        }
        try {
            step.run();
            stepResults.push({ name: step.name, status: "ran" });
        } catch (err) {
            console.log(err);
            stepResults.push({ name: step.name, status: "failed", error: err });
            if (eager) throw new StepError(step.name, err, stepResults);
        }
    }
}
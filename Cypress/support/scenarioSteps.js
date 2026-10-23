const steps = [];

export const resetScenarioSteps = () => {
  steps.length = 0;
};

export const recordScenarioStep = (message) => {
  steps.push(message);
};

export const scenarioSteps = () => steps.slice();

import Konva from 'konva';

export const exportToPNG = (containerId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const container = document.getElementById(containerId);
    if (!container) {
      reject(new Error(`Container with id "${containerId}" not found`));
      return;
    }

    const stages = Konva.stages.filter(
      (s) => s.container() === container || container.contains(s.container())
    );

    if (stages.length === 0) {
      reject(new Error('No Konva stage found in the container'));
      return;
    }

    const stage = stages[0];
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    resolve(dataURL);
  });
};

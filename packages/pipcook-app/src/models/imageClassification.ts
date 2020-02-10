
import * as tf from '@tensorflow/tfjs-node-gpu';

import {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner, ModelDeploy} from '@pipcook/pipcook-core';
import imageClassDataAccess from '@pipcook/pipcook-plugins-image-class-data-access';
import mobileNetLoad from '@pipcook/pipcook-plugins-local-mobilenet-model-load';
import modelTrainPlugin from '@pipcook/pipcook-plugins-model-train';
import modelEvaluatePlugin from '@pipcook/pipcook-plugins-model-evaluate';
import imageClassDataCollect from '@pipcook/pipcook-plugins-image-class-data-collect';
import imageClassLocalModelDeploy from '@pipcook/pipcook-plugins-image-class-local-model-deploy';
import simpleCnnModelLoad from '@pipcook/pipcook-plugins-simple-cnn-model-load';


export interface MetaDataI {
  imageSize: number[];
  optimizer?: tf.Optimizer | string;
  loss? : any;
  metrics?: any;
}

export interface TrainInfoI {
  epochs?: number;
  batchSize?: number;
  shuffle?: number;
  freeze?: boolean;
}

export default class ImageClassification {

  model: string;
  metaData: MetaDataI;
  modelId: string;

  constructor(model: string, metaData: MetaDataI, modelId?: string) {
    this.model = model;
    this.metaData = metaData;
    if (modelId) {
      this.modelId = modelId;
    }
  }

  async train(dataSource: string, trainInfo: TrainInfoI, predictServer=false, 
    successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) {
    const dataCollect = DataCollect(imageClassDataCollect, {
      url: dataSource
    });

    const dataAccess = DataAccess(imageClassDataAccess, {
      imgSize: this.metaData.imageSize,
    });

    let modelLoad: any;

    const modelTrain = ModelTrain(modelTrainPlugin, {
      epochs: trainInfo.epochs,
      batchSize: trainInfo.batchSize,
      shuffle: trainInfo.shuffle
    });

    const modelEvaluate = ModelEvaluate(modelEvaluatePlugin);

    if (this.model.toLowerCase() === 'mobilenet') {
      modelLoad = ModelLoad(mobileNetLoad, {
        isFreeze: trainInfo.freeze,
        optimizer: this.metaData.optimizer,
        loss: this.metaData.loss,
        metrics: this.metaData.metrics,
      });      
    } else if (this.model.toLowerCase() === 'simplecnn') {
      modelLoad = ModelLoad(simpleCnnModelLoad, {
        optimizer: this.metaData.optimizer,
        loss: this.metaData.loss,
        metrics: this.metaData.metrics,
      });
    } else {
      console.error('the model name can only be mobilenet or simplecnn!');
      return;
    }
    const modelDeploy = ModelDeploy(imageClassLocalModelDeploy);

    const runner = new PipcookRunner({
      predictServer
    });  
    await runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy], successCallback, errorCallback, saveModelCallback)
  }
}
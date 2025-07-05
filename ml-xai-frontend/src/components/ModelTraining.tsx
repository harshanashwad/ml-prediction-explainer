
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Play, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { trainModel } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

const ModelTraining = ({ uploadData, target, targetType, onTrainingComplete, onViewShapExplanations }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [trainingResults, setTrainingResults] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [showExplanationsButton, setShowExplanationsButton] = useState(false);
  const { toast } = useToast();

  // Set model based on target type and is triggered when we select target in TargetSelection.tsx
  useEffect(() => {
    if (targetType === 'numeric') {
      const modelName = 'Random Forest Regressor';
      setSelectedModel(modelName);
    }
    if (targetType === 'categorical') {
      const modelName = 'Random Forest Classifier';
      setSelectedModel(modelName);
    }

  }, [targetType]);

  const startTraining = async () => {
    if (!target) {
      toast({
        title: "No target selected",
        description: "Please select a target variable first.",
        variant: "destructive",
      });
      return;
    }

    setIsTraining(true);
    try {
      const result = await trainModel(target);
      setTrainingResults(result);
      setTrainingComplete(true);
      onTrainingComplete(result)  // this is the prop function to update the trainingResults state in Index.tsx
      setShowExplanationsButton(true);
      toast({
        title: "Training completed!",
        description: `${result.model_type} trained successfully.`,
      });
    } catch (error) {
      console.error('Training error:', error);
      toast({
        title: "Training failed",
        description: error.response?.data?.detail || "Failed to train model.",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleViewExplanations = () => {
    onViewShapExplanations();
  };

  const TrainingAnimation = () => (
    <div className="flex flex-col items-center space-y-4 p-8">
      <div className="relative">
        <div className="h-16 w-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
        <Brain className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Training Your Model</h3>
        <p className="text-blue-700">Analyzing data and building ML model...</p>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-600">• Preprocessing features</div>
          <div className="text-sm text-gray-600">• Training algorithm</div>
          <div className="text-sm text-gray-600">• Generating explanations</div>
        </div>
      </div>
    </div>
  );

  const ModelMetrics = ({ data }) => {
    if (!data) return null;

    const isClassification = data.task === 'classification';
    
    // Helper function to determine font size based on content length
    const getFontSize = (value) => {
      const valueStr = String(value);
      if (valueStr.length <= 4) return 'text-2xl';
      if (valueStr.length <= 6) return 'text-xl';
      if (valueStr.length <= 8) return 'text-lg';
      return 'text-base';
    };
    
    return (
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Training Results
        </h4>

        {/* Target Variable Display */}
        {/* <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-2">
            <span className="text-blue-700 font-medium">Target Variable:</span>
            <span className="text-blue-900 font-bold text-lg">{target}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              targetType === 'numeric'
                ? 'bg-green-100 text-green-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {targetType}
            </span>
          </div>
        </div> */}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isClassification ? (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-black">
                <div className="text-black font-medium">Accuracy</div>
                <div className={`${getFontSize((data.metrics.accuracy * 100).toFixed(1) + '%')} font-bold text-black`}>
                  {(data.metrics.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-black">
                <div className="text-black font-medium">Precision</div>
                <div className={`${getFontSize((data.metrics.precision * 100).toFixed(1) + '%')} font-bold text-black`}>
                  {(data.metrics.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-black">
                <div className="text-black font-medium">F1 Score</div>
                <div className={`${getFontSize((data.metrics.f1_score * 100).toFixed(1) + '%')} font-bold text-black`}>
                  {(data.metrics.f1_score * 100).toFixed(1)}%
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-black">
                <div className="text-black font-medium">R² Score</div>
                <div className={`${getFontSize((data.metrics.r2 * 100).toFixed(1) + '%')} font-bold text-black`}>
                  {(data.metrics.r2 * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-black">
                <div className="text-black font-medium">MAE</div>
                <div className={`${getFontSize(data.metrics.mae.toLocaleString())} font-bold text-black`}>
                  {data.metrics.mae.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-black">
                <div className="text-black font-medium">MSE</div>
                <div className={`${getFontSize(data.metrics.mse.toLocaleString())} font-bold text-black`}>
                  {data.metrics.mse.toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Model Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Model Type:</span>
            <span className="ml-2 font-medium">{data.model_type}</span>
          </div>
          <div>
            <span className="text-gray-600">Task:</span>
            <span className="ml-2 font-medium capitalize">{data.task}</span>
          </div>
          <div>
            <span className="text-gray-600">Target variable:</span>
            <span className="ml-2 font-medium">{target}</span>
          </div>
          <div>
            <span className="text-gray-600">Training Samples:</span>
            <span className="ml-2 font-medium">{data.training_samples}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Brain className="h-6 w-6 text-blue-600" />
            Train ML Model
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Train a machine learning model on your dataset and generate SHAP explanations
          </p>
        </CardHeader>
        <CardContent>
          {!isTraining && (
            <div className="text-center">
              {/* Select Model Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Select Model</h3>
                <div className="flex justify-center">
                  <button
                    onClick={() => setSelectedModel(selectedModel)}
                    className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 shadow-md transition-all duration-200 hover:scale-102 min-w-[400px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-900">
                        {selectedModel || 'Random Forest Regressor'}
                      </span>
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                  </button>
                </div>
              </div>

              {!trainingComplete && (
                <>
                  <Button
                    onClick={startTraining}
                    disabled={!target}
                    className={`px-8 py-4 text-lg transition-all duration-300 ${
                      target
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Training
                  </Button>
                  {target && (
                    <p className="text-sm text-gray-600 mt-2">
                      Target: <span className="font-medium text-blue-600">{target}</span>
                    </p>
                  )}
                </>
              )}

              {/* Display Metrics after training */}
              {trainingComplete && trainingResults && (
                <ModelMetrics data={trainingResults} />
              )}

              {/* View Explanations Button */}
              {showExplanationsButton && (
                <div className="mt-8">
                  <Button
                    onClick={handleViewExplanations}
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    View SHAP Explanations
                  </Button>
                </div>
              )}
            </div>
          )}

          {isTraining && <TrainingAnimation />}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelTraining;

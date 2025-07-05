
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Brain, BarChart3, Target } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import TargetSelection from '@/components/TargetSelection';
import ModelTraining from '@/components/ModelTraining';
import Results from '@/components/Results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadData, setUploadData] = useState(null);
  const [trainingResults, setTrainingResults] = useState(null);
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState('');

  const steps = [
    { id: 1, title: 'Upload Data', icon: Upload, description: 'Upload your CSV dataset' },
    { id: 2, title: 'Select Target', icon: Target, description: 'Choose a target variable' },
    { id: 3, title: 'Train Model', icon: Brain, description: 'Train ML model' },
    { id: 4, title: 'View Results', icon: BarChart3, description: 'Analyze explanations' }
  ];

  const handleUploadSuccess = (data) => {
    setUploadData(data);
    console.log(data);
    setCurrentStep(2);
  };

  const handleTargetSelected = (target, targetType) => {
    setTarget(target);
    setTargetType(targetType);
    setCurrentStep(3);
  };

  const handleTrainingComplete = (data) => {
    setTrainingResults(data);
  };

  const handleViewShapExplanations = () => {
      setCurrentStep(4);
  }

  const resetToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
    if (stepNumber === 1) {
      setUploadData(null);
      setTrainingResults(null);
      setTarget('')
      setTargetType('')
    } else if (stepNumber === 2) {
      setTrainingResults(null);
      setTarget('')
      setTargetType('')
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - Added more top margin */}
        <div className="text-center mb-8 mt-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ML Prediction Explainer
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Upload your dataset, train a model, and get detailed explanations of how your ML model makes predictions
          </p>
        </div>

        {/* Progress Steps - Added more top margin */}
        <div className="mb-8 mt-12">
          <div className="flex justify-center items-center space-x-4 overflow-x-auto pb-4 pt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isClickable = isCompleted || (step.id === 1);

              return (
                <div key={step.id} className="flex items-center">
                  <button
                  // if the step is clickable, reset to the step
                    onClick={() => isClickable && resetToStep(step.id)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center p-4 rounded-lg transition-all duration-300 min-w-[120px] ${
                      isActive
                        ? 'opacity-100 bg-blue-100 border-2 border-blue-500 shadow-lg scale-105'
                        : isCompleted
                        ? 'opacity-100 bg-green-100 border-2 border-green-500 hover:scale-105 cursor-pointer'
                        : 'bg-gray-100 border-2 border-gray-300'
                    } ${!isClickable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon
                      className={`h-6 w-6 mb-2 ${
                        isActive
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-blue-900'
                          : isCompleted
                          ? 'text-green-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span
                      className={`text-xs text-center ${
                        isActive
                          ? 'text-blue-800'
                          : isCompleted
                          ? 'text-green-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.description}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content: Render the relevant component based on current step */}
        <div className="transition-all duration-500 ease-in-out mb-16">
          {currentStep === 1 && (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          )}
          {currentStep === 2 && (
            <TargetSelection 
              uploadData={uploadData} 
              onTargetSelected={handleTargetSelected}
            />
          )}
          {currentStep === 3 && (
            <ModelTraining 
              uploadData={uploadData}
              target={target}
              targetType={targetType}
              onTrainingComplete={handleTrainingComplete}
              onViewShapExplanations = {handleViewShapExplanations}
            />
          )}
          {currentStep === 4 && (
            <Results 
            trainingResults={trainingResults}
            target={target}
             />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

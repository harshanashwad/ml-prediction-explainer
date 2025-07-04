
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Target, TrendingUp, TrendingDown } from 'lucide-react';

function LocalShapResults({ data, model_type }) {
  if (!data || !data.length || !model_type) return null;

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Eye className="h-5 w-5 text-blue-600" />
          Local Explanations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item) => {
            const rowId = item.row_index;
            const prediction = item.prediction;

            if (model_type === "RandomForestRegressor") {
              const sortedContributions = Object.entries(item.shap_contributions).sort(
                (a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1]))
              );

              return (
                <Card key={rowId} className="border-l-4 border-l-blue-500 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Row #{rowId}</span>
                    </div>
                    <div className="mb-4 p-3 bg-white rounded-lg border">
                      <span className="text-sm text-gray-600">Prediction: </span>
                      <span className="text-lg font-bold text-green-600">
                        {Number(prediction).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 mb-3">Feature Contributions:</h4>
                      {sortedContributions.map(([feature, val], index) => {
                        const numVal = Number(val);
                        const isPositive = numVal > 0;
                        const barWidth = Math.min(Math.abs(numVal) / Math.max(...sortedContributions.map(([, v]) => Math.abs(Number(v)))) * 100, 100);
                        
                        return (
                          <div key={feature} className="p-2 bg-white rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{feature}</span>
                              <div className="flex items-center gap-1">
                                {isPositive ? (
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-red-500" />
                                )}
                                <span className={`text-sm font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {numVal.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  isPositive ? 'bg-green-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            }

            if (model_type === "RandomForestClassifier") {
              const predictedClass = item.class_wise_feature_contributions.find(
                (c) => c.class === prediction
              );
              const sortedContributions = Object.entries(predictedClass.contributions).sort(
                (a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1]))
              );

              return (
                <Card key={rowId} className="border-l-4 border-l-purple-500 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Row #{rowId}</span>
                    </div>
                    <div className="mb-4 p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-600">Predicted Class: </span>
                          <span className="text-lg font-bold text-purple-600">{prediction}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Probability: </span>
                          <span className="text-lg font-bold text-green-600">
                            {(Number(predictedClass.probability) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 mb-3">Feature Contributions:</h4>
                      {sortedContributions.map(([feature, val], index) => {
                        const numVal = Number(val);
                        const isPositive = numVal > 0;
                        const barWidth = Math.min(Math.abs(numVal) / Math.max(...sortedContributions.map(([, v]) => Math.abs(Number(v)))) * 100, 100);
                        
                        return (
                          <div key={feature} className="p-2 bg-white rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{feature}</span>
                              <div className="flex items-center gap-1">
                                {isPositive ? (
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-red-500" />
                                )}
                                <span className={`text-sm font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {numVal.toFixed(3)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  isPositive ? 'bg-green-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return null;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default LocalShapResults;

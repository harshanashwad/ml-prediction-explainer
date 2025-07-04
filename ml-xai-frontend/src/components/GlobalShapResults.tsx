
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';

function GlobalShapResults({ data, model_type }) {
  if (!data || !model_type) return null;

  let displayData = [];

  if (model_type === "RandomForestRegressor") {
    // For regression, use the data directly and sort by importance
    displayData = [...data].sort((a, b) => b.importance - a.importance);
  } else if (model_type === "RandomForestClassifier") {
    // For classification, aggregate feature importances across classes
    const featureSums = {};
    const featureCounts = {};

    data.forEach((classData) => {
      classData.features.forEach((item) => {
        featureSums[item.feature] = (featureSums[item.feature] || 0) + item.importance;
        featureCounts[item.feature] = (featureCounts[item.feature] || 0) + 1;
      });
    });

    displayData = Object.keys(featureSums).map((feature) => ({
      feature,
      importance: featureSums[feature] / featureCounts[feature],
    })).sort((a, b) => b.importance - a.importance);
  }

  // Get max importance for scaling bars
  const maxImportance = displayData.length > 0 ? displayData[0].importance : 1;

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Global Feature Importance
          {model_type === "RandomForestClassifier" && (
            <span className="text-sm text-gray-500 font-normal ml-2">
              (Averaged across all classes)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayData.map((item, index) => {
            const barWidth = (item.importance / maxImportance) * 100;
            const isTop3 = index < 3;
            
            return (
              <div 
                key={item.feature} 
                className={`p-4 rounded-lg transition-all duration-300 hover:shadow-md ${
                  isTop3 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${isTop3 ? 'text-blue-900' : 'text-gray-700'}`}>
                    {index + 1}. {item.feature}
                  </span>
                  <span className={`text-sm font-mono ${isTop3 ? 'text-blue-700' : 'text-gray-600'}`}>
                    {model_type === "RandomForestRegressor"
                      ? Number(item.importance).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })
                      : item.importance.toFixed(3)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isTop3 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {displayData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No feature importance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GlobalShapResults;

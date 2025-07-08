
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';

function GlobalShapResults({ data, model_type, target }) {
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

  // Get top 10 features for chart
  const top10Features = displayData.slice(0, 10);
  
  // Get top 3 features for textual summary
  const topFeatures = displayData.slice(0, 3);
  
  // Determine if it's regression or classification
  const isRegression = model_type === "RandomForestRegressor";
  
  // Generate textual summary
  const generateTextualSummary = () => {
    const targetName = target || 'target variable';
    
    const introText = isRegression 
      ? `The following features have the greatest average impact on the predicted ${targetName}. Higher importance values indicate features that strongly influence the prediction magnitude.`
      : `These features have the greatest average impact on the model's decision to predict ${targetName}. Importance is averaged across all classes for simplicity.`;
    
    return {
      intro: introText,
      topFeatures: topFeatures
    };
  };

  const textualSummary = generateTextualSummary();

  // Function to get feature description based on rank
  const getFeatureDescription = (index, featureName) => {
    const targetName = target || 'the target variable';
    if (index === 0) {
      return (
        <>
          <strong>{featureName}</strong> significantly contributes to the prediction of {targetName}.
        </>
      );
    } else if (index === 1) {
      return (
        <>
          <strong>{featureName}</strong> has a strong influence on {targetName}.
        </>
      );
    } else if (index === 2) {
      return (
        <>
          The model considers <strong>{featureName}</strong> important when making decisions about {targetName}.
        </>
      );
    }
    return (
      <>
        <strong>{featureName}</strong> has a strong influence on {targetName}.
      </>
    );
  };

  // Colors for the bars - dark for top 3, light for others
  const getBarColor = (index) => {
    return index < 3 ? '#1E40AF' : '#60A5FA'; // Dark blue for top 3, light blue for others
  };

  // Valid features also feels a bit unnecessary (might scrap later and ensure the values are filled and valid from api response)
  // Data validation and preparation for chart
  const validFeatures = top10Features.filter(item => 
    item.importance !== undefined && 
    item.importance !== null && 
    !isNaN(Number(item.importance))
  );

  if (validFeatures.length === 0) {
    console.warn('No valid feature importance data found');
  }


  // Custom tooltip component with proper TypeScript typing
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: any }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-1">
            {data.feature}
          </p>
          <p className="text-sm text-gray-600">
            Global Importance: <span className="font-bold text-blue-600">
              {data.importance.toFixed(3)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Textual Summary Card */}
      <Card className="shadow-lg animate-fade-in bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-blue-900">
            <FileText className="h-5 w-5 text-blue-600" />
            Key Features Driving Model Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {textualSummary.intro}
          </p>
          
          {topFeatures.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">
                The top {topFeatures.length} features contributing to predictions are:
              </h4>
              <ul className="space-y-3">
                {topFeatures.map((item, index) => (
                  <li key={item.feature} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-800">
                        {index + 1}. {item.feature}
                      </span>
                      <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Importance: {isRegression
                          ? Number(item.importance).toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })
                          : item.importance.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 ml-4">
                      {getFeatureDescription(index, item.feature)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Features with lower importance still contribute but have less overall impact. 
              Explore local explanations for row-specific insights.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Horizontal Bar Chart */}
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
          {validFeatures.length > 0 ? (
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={validFeatures}
                  layout="vertical"
                  margin={{ top: 20, right: 70, left: 100, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    label={{ 
                      value: 'SHAP Global Importance', 
                      position: 'insideBottom', 
                      offset: -10,
                      style: { textAnchor: 'middle', fontSize: '14px', fill: '#374151' }
                    }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="feature" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    width={140}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="importance"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                    animationBegin={0}
                  >
                    {validFeatures.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No feature importance data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GlobalShapResults;

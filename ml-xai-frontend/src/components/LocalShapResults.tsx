
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, ChartBarStacked, TrendingUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { get } from "http";

function LocalShapResults({ data, model_type, baseline, target }) {
  if (!data || !data.length || !model_type) return null;
  // console.log(data)
  const getBaselineValue = (index=0) => {
    if (model_type === "RandomForestRegressor") {
      // console.log(baseline[0])
      return baseline && baseline.length > 0 ? baseline[0] : 0;
    } else {
      // console.log(data[index].baseline_probability_for_predicted_class)
      return data[index].baseline_probability_for_predicted_class
    }
  };

  // const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any; label?: any }) => {
  //   if (active && payload && payload.length) {
  //     // Find the SHAP contribution value (dataKey 'uv')
  //     const shapValue = payload.find(p => p.dataKey === 'uv');
  //     if (shapValue && shapValue.value !== 0) {
  //       return (
  //         <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
  //           <p className="font-bold text-gray-900">{label}</p>
  //           <p className="text-sm text-gray-600">
  //             SHAP Value: <span className="font-mono font-bold">{shapValue.value.toFixed(4)}</span>
  //           </p>
  //         </div>
  //       );
  //     }
  //   }
  //   return null;
  // };
  
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any; label?: any }) => {
    if (active && payload && payload.length) {
      const shapValue = payload.find(p => p.dataKey === 'uv');
      const dataItem = payload[0].payload; // Get the full data item
      
      // Check if this is the Baseline or Prediction row
      const isBaseline = label === 'Baseline';
      const isPrediction = label === 'Prediction';
  
      if (isBaseline) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-bold text-gray-900">{label}</p>
            <p className="text-sm text-gray-600">
              Baseline Value: <span className="font-mono font-bold">{shapValue.value.toFixed(4)}</span>
            </p>
          </div>
        );
      }
  
      if (isPrediction) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-bold text-gray-900">{label}</p>
            <p className="text-sm text-gray-600">
              Final Prediction: <span className="font-mono font-bold">{shapValue.value.toFixed(4)}</span>
            </p>
          </div>
        );
      }
  
      if (shapValue && shapValue.value !== 0) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-bold text-gray-900">{label}</p>
            <p className="text-sm text-gray-600">
              SHAP Contribution: <span className="font-mono font-bold">{shapValue.value > 0 ? '+' : ''}{shapValue.value.toFixed(4)}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Cumulative: {(dataItem.pv + shapValue.value).toFixed(4)}
            </p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Eye className="h-5 w-5 text-blue-600" />
          Local Explanations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {data.map((item, index) => {
            const rowId = item.row_index;
            const prediction = item.prediction;

            if (model_type === "RandomForestRegressor") {
              // Get SHAP contributions and sort by absolute value
              const contributions = Object.entries(item.shap_contributions)
                .map(([feature, value]) => ({
                  feature,
                  value: Number(value)
                }))
                .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

              
              // Calculate cumulative values starting from baseline
              const baselineValue = getBaselineValue();
              let cumulative = baselineValue;
              const cumulativeValues = contributions.map(contrib => {
                cumulative += contrib.value;
                return cumulative;
              });

              // Find min and max of all cumulative values (including baseline)
              const minCumulative = Math.min(baselineValue, ...cumulativeValues);
              const maxCumulative = Math.max(baselineValue, ...cumulativeValues);
              const range = maxCumulative - minCumulative;
              const padding = range * 0.1;  // 0.2 = 20% padding (use 0.1 for 10%)
              const xDomain = [minCumulative - padding, maxCumulative + padding];

              
              const top3Contributors = contributions.slice(0, 3);
              // Prepare waterfall data with cumulative values

              const chartData = (() => {
                let cumulative = baselineValue;
                
                return [
                  {
                    name: 'Baseline',
                    pv: 0,
                    uv: baselineValue,
                    isSpecial: true
                  },
                  ...contributions.map(contrib => {
                    const start = cumulative;
                    cumulative += contrib.value;
                    return {
                      name: contrib.feature,
                      pv: start,
                      uv: contrib.value,
                      isSpecial: false
                    };
                  }),
                  {
                    name: 'Prediction',
                    pv: 0,
                    uv: cumulative,
                    isSpecial: true
                  }
                ];
              })();
              // console.log(chartData)
    
              return (
                <Card key={rowId} className="border-l-4 border-l-blue-500 bg-blue-50">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUpDown className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-900">
                        Prediction Explanation for Row #{rowId}
                      </h3>
                    </div>

                    {/* Prediction Summary */}
                    <div className="mb-6 p-4 bg-white rounded-lg border">
                      <p className="text-gray-700 mb-2">
                        The model predicted <span className="font-semibold">{target}</span> ={' '}
                        <span className="text-lg font-bold text-blue-600">{String(prediction)}</span>
                      </p>

                      <p className="text-gray-600 text-sm">
                        The baseline prediction is{' '}
                        <span className="font-semibold">
                          {typeof baselineValue === 'number' ? baselineValue.toFixed(2) : String(baselineValue)}
                        </span>{' '}
                        (baseline = model output when none of the features are provided). 
                        The SHAP values below explain how the prediction deviates from this baseline.
                      </p>
                    </div>

                    {/* Top Contributors */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        The top 3 features influencing this prediction are:
                      </h4>
                      <ul className="space-y-2">
                        {top3Contributors.map((contrib, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${contrib.value > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-medium text-gray-700">{contrib.feature}:</span>
                            <span className={contrib.value > 0 ? 'text-green-600' : 'text-red-600'}>
                              {contrib.value > 0 ? 'Increased' : 'Decreased'} the predicted {target} by{' '}
                              {Math.abs(contrib.value).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Closing Note */}
                    <p className="text-sm text-gray-600 mb-6">
                      Other features also contribute smaller amounts. See the visualization below for a complete breakdown.
                    </p>

                    {/* Waterfall Plot */}
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-800 mb-4 text-center">
                        How Features Shape the Prediction for Row #{rowId}
                      </h4>
                      <div className="h-96">

                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={
                              // (() => {
                              //   let cumulative = baselineValue;
                              //   return contributions.map((contrib, index) => {
                              //     const start = cumulative;
                              //     cumulative += contrib.value;
                              //     return {
                              //       name: contrib.feature,
                              //       pv: start,
                              //       uv: contrib.value,
                              //     };
                              //   });
                              // })()
                              chartData
                            }
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              type="number"
                              domain={xDomain}
                              allowDataOverflow
                              scale="linear"
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                              tickLine={{ stroke: '#d1d5db' }}
                              label={{
                                value: 'SHAP Contribution',
                                position: 'insideBottom',
                                offset: -10,
                                style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' },
                              }}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              // tick={({ x, y, payload }) => {
                              //   const isSpecial = chartData.find(d => d.name === payload.value)?.isSpecial;
                              //   return (
                              //     <g transform={`translate(${x},${y})`}>
                              //       <text
                              //         x={0}
                              //         y={0}
                              //         dy={2}
                              //         textAnchor="end"
                              //         fill={isSpecial ? '#4F46E5' : '#6b7280'}
                              //         fontWeight={isSpecial ? 'bold' : 'normal'}
                              //         fontSize={isSpecial ? 13 : 11}
                              //       >
                              //         {payload.value}
                              //       </text>
                              //     </g>
                              //   );
                              // }}
                              
                              
                              axisLine={{ stroke: '#d1d5db' }}
                              tickLine={{ stroke: '#d1d5db' }}
                              width={150}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Transparent base bar */}
                            <Bar dataKey="pv" stackId="a" fill="transparent" />
                            {/* Colored contribution bar */}
                            <Bar dataKey="uv" stackId="a" radius={[0,4,4,0]}>
                              {/* {(() => {
                                let cumulative = baselineValue;
                                return contributions.map((entry, index) => {
                                  cumulative += entry.value;
                                  return (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        entry.value > 0
                                          ? '#10B981' // Green
                                          : '#EF4444' // Red
                                      }
                                    />
                                  );
                                });
                              })()} */}
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.isSpecial 
                                      ? '#6366F1' // Purple for special bars
                                      : entry.uv > 0
                                        ? '#10B981' // Green
                                        : '#EF4444' // Red
                                  }
                                  stroke={entry.isSpecial ? '#4F46E5' : undefined}
                                  strokeWidth={entry.isSpecial ? 2 : 0}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>

                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            if (model_type === "RandomForestClassifier") {
              const predictedClass = item.class_wise_feature_contributions.find(
                (c) => c.class === prediction
              );
              
              if (!predictedClass) return null;

              // Get SHAP contributions for the predicted class and sort by absolute value
              const contributions = Object.entries(predictedClass.contributions)
                .map(([feature, value]) => ({
                  feature,
                  value: Number(value)
                }))
                .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

               // Calculate cumulative values starting from baseline
              const baselineValue = getBaselineValue(index);
              let cumulative = baselineValue;
              const cumulativeValues = contributions.map(contrib => {
                cumulative += contrib.value;
                return cumulative;
              });

              // Find min and max of all cumulative values (including baseline)
              const minCumulative = Math.min(baselineValue, ...cumulativeValues);
              const maxCumulative = Math.max(baselineValue, ...cumulativeValues);
              const range = maxCumulative - minCumulative;
              const padding = range * 0.1;  // 0.2 = 20% padding (use 0.1 for 10%)
              const xDomain = [minCumulative - padding, maxCumulative + padding];

              const top3Contributors = contributions.slice(0, 3);

              const chartData = (() => {
                let cumulative = baselineValue;
                
                return [
                  {
                    name: 'Baseline',
                    pv: 0,
                    uv: baselineValue,
                    isSpecial: true
                  },
                  ...contributions.map(contrib => {
                    const start = cumulative;
                    cumulative += contrib.value;
                    return {
                      name: contrib.feature,
                      pv: start,
                      uv: contrib.value,
                      isSpecial: false
                    };
                  }),
                  {
                    name: 'Prediction',
                    pv: 0,
                    uv: cumulative,
                    isSpecial: true
                  }
                ];
              })();

              return (
                <Card key={rowId} className="border-l-4 border-l-indigo-500 bg-indigo-50">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUpDown className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-indigo-900">
                        Prediction Explanation for Row #{rowId}
                      </h3>
                    </div>

                    {/* Prediction Summary */}
                    <div className="mb-6 p-4 bg-white rounded-lg border">
                      <p className="text-gray-700 mb-2">
                        The model predicted <span className="font-semibold">{target}</span> as{' '}
                        <span className="text-lg font-bold text-indigo-600">{prediction}</span>{' '}
                        with a probability of{' '}
                        <span className="text-lg font-bold text-green-600">
                          {(Number(predictedClass.probability)).toFixed(2)}
                        </span>.
                      </p>
                      <p className="text-gray-600 text-sm">
                        The baseline probability for this class is{' '}
                        <span className="font-semibold">{(baselineValue).toFixed(3)}</span>{' '}
                        (the probability assigned to this class when no features are provided). 
                        The features below explain why this class was predicted.
                      </p>
                    </div>

                    {/* Top Contributors */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        The top 3 features influencing this prediction are:
                      </h4>
                      <ul className="space-y-2">
                        {top3Contributors.map((contrib, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${contrib.value > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-medium text-gray-700">{contrib.feature}:</span>
                            <span className={contrib.value > 0 ? 'text-green-600' : 'text-red-600'}>
                              {contrib.value > 0 ? 'Increased' : 'Decreased'} the probability of "{prediction}" by{' '}
                              {Math.abs(contrib.value).toFixed(3)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Closing Note */}
                    <p className="text-sm text-gray-600 mb-6">
                      Other features also contribute smaller amounts. See the visualization below for a complete breakdown.
                    </p>

                    {/* Waterfall Plot */}
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-800 mb-4 text-center">
                        How Features Shape the Prediction for Row #{rowId}
                      </h4>
                      <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            // data={
                            //   (() => {
                            //     let cumulative = baselineValue;
                            //     return contributions.map((contrib, index) => {
                            //       const start = cumulative;
                            //       cumulative += contrib.value;
                            //       return {
                            //         name: contrib.feature,
                            //         pv: start,
                            //         uv: contrib.value,
                            //       };
                            //     });
                            //   })()
                            // }
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 20, right: 70, left: 100, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              type="number"
                              domain={xDomain}
                              scale="linear"
                              allowDataOverflow
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                              tickLine={{ stroke: '#d1d5db' }}
                              label={{
                                value: 'SHAP Contribution',
                                position: 'insideBottom',
                                offset: -10,
                                style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' },
                              }}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                              tickLine={{ stroke: '#d1d5db' }}
                              width={120}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Transparent base bar */}
                            <Bar dataKey="pv" stackId="a" fill="transparent" />
                            {/* Colored contribution bar */}
                            <Bar dataKey="uv" stackId="a" radius={[0,4,4,0]}>
                              {/* {(() => {
                                let cumulative = baselineValue;
                                return contributions.map((entry, index) => {
                                  cumulative += entry.value;
                                  return (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        entry.value > 0
                                          ? '#10B981' // Green
                                          : '#EF4444' // Red
                                      }
                                    />
                                  );
                                });
                              })()} */}

                              {chartData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        entry.isSpecial 
                                          ? '#6366F1' // Purple for special bars
                                          : entry.uv > 0
                                            ? '#10B981' // Green
                                            : '#EF4444' // Red
                                      }
                                      stroke={entry.isSpecial ? '#4F46E5' : undefined}
                                      strokeWidth={entry.isSpecial ? 2 : 0}
                                    />
                                  ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>

                      </div>
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

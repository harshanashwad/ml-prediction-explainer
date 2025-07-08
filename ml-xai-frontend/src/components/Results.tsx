
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Eye, RefreshCw, Download, Target } from 'lucide-react';
import { getExplanations } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import GlobalShapResults from './GlobalShapResults';
import LocalShapResults from './LocalShapResults';

const Results = ({ trainingResults, target }) => {
  const [explanationsData, setExplanationsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('global');
  const [rowRange, setRowRange] = useState({ start: 0, end: 1 });
  const { toast } = useToast();

  useEffect(() => {
    if (trainingResults) {
      fetchExplanations();
    }
  }, [trainingResults]);

  const fetchExplanations = async (start = 0, end = 1) => {
    setIsLoading(true);
    try {
      const result = await getExplanations(start, end);
      setExplanationsData(result);
      setRowRange({ start, end });
    } catch (error) {
      console.error('Explanations error:', error);
      toast({
        title: "Failed to load explanations",
        description: error.response?.data?.detail || "Could not fetch model explanations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowRangeChange = () => {
    fetchExplanations(rowRange.start, rowRange.end);
  };

  if (!trainingResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No training data available. Please train a model first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 mb-6">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Model Explanations & Results
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Understand how your {trainingResults.model_type} makes predictions using SHAP values
          </p>

          {/* Target Variable Display */}
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 font-medium">Predicting:</span>
            <span className="text-blue-900 font-bold">{target || 'Unknown Target'}</span>
          </div>

        </CardHeader>
        <CardContent>
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setActiveTab('global')}
                className={`px-6 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'global'
                    ? 'bg-white shadow-md text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Global Importance
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`px-6 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'local'
                    ? 'bg-white shadow-md text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Local Explanations
              </button>
            </div>
          </div>

          {/* Local Explanations Controls */}
          {activeTab === 'local' && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-3">Row Range Selection</h4>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label htmlFor="start-row-input" className="text-sm text-blue-700">Start:</label>
                  <input
                    id="start-row-input"
                    name="startRow"
                    type="number"
                    value={rowRange.start}
                    onChange={(e) => setRowRange({ ...rowRange, start: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 border border-blue-200 rounded text-sm"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="end-row-input" className="text-sm text-blue-700">End:</label>
                  <input
                    id="end-row-input"
                    name="endRow"
                    type="number"
                    value={rowRange.end}
                    onChange={(e) => setRowRange({ ...rowRange, end: parseInt(e.target.value) || 1 })}
                    className="w-20 px-2 py-1 border border-blue-200 rounded text-sm"
                    min="1"
                  />
                </div>
                <Button
                  onClick={handleRowRangeChange}
                  disabled={isLoading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Update Range
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="h-8 w-8 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-600">Loading explanations...</p>
            </div>
          )}

          {/* Results Content */}
          {!isLoading && explanationsData && (
            <div className="space-y-6">
              {activeTab === 'global' && (
                <GlobalShapResults 
                  data={explanationsData.global_feature_importance} 
                  model_type={explanationsData.model_type}
                  target ={target}
                />
              )}
              
              {activeTab === 'local' && (
                <LocalShapResults 
                  data={explanationsData.local_explanations} 
                  model_type={explanationsData.model_type}
                  baseline={explanationsData.baseline}
                  target={target}
                />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={() => fetchExplanations(rowRange.start, rowRange.end)}
              disabled={isLoading}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                // Future: implement download functionality
                toast({
                  title: "Feature coming soon",
                  description: "Export functionality will be available in the next update.",
                });
              }}
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;

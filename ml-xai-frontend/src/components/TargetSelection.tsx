
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

const TargetSelection = ({ uploadData, onTargetSelected }) => {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [targetType, setTargetType] = useState('');

  if (!uploadData || !uploadData.columns) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">No upload data available. Please upload a file first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTargetSelect = (column) => {
    setSelectedTarget(column);
    setTargetType(getColumnType(column));
  };

  const handleContinue = () => {
    if (selectedTarget) {
      onTargetSelected(selectedTarget, targetType);
    }
  };

  const hasWarnings = uploadData.warnings && uploadData.warnings.length > 0;

  const getColumnType = (column) => {
    if (uploadData.column_types?.numeric?.includes(column)) {
      return 'numeric';
    } else if (uploadData.column_types?.categorical?.includes(column)) {
      return 'categorical';
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-blue-600" />
            Select Target Variable
            {hasWarnings && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="ml-2 relative">
                    <AlertTriangle className="h-5 w-5 text-amber-500 hover:text-amber-600 transition-colors" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full"></span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="center">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">Dataset Warnings</span>
                    </div>
                    <div className="space-y-2">
                      {uploadData.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                          <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span className="text-sm text-amber-800">{warning}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      These issues may affect model performance but won't prevent training.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Choose the column you want to predict (target variable)
          </p>
        </CardHeader>
        <CardContent>
          {/* Dataset Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Dataset Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Rows:</span>
                <span className="ml-2 text-blue-900">{uploadData.row_count || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Columns:</span>
                <span className="ml-2 text-blue-900">{uploadData.column_count || uploadData.columns?.length || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Missing Values:</span>
                <span className="ml-2 text-blue-900">{uploadData.missing_values || 0}</span>
              </div>
              {hasWarnings && (
                <div>
                  <span className="text-blue-700 font-medium">Issues:</span>
                  <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">
                    {uploadData.warnings.length}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Column Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {uploadData.columns.map((column, index) => {
              const isSelected = selectedTarget === column;
              const columnType = getColumnType(column);
              
              return (
                <button
                  key={index}
                  onClick={() => handleTargetSelect(column)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-102 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {column}
                    </span>
                    <div className={`h-2 w-2 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {/* dynamic label color for numeric and categorical types */}
                    {columnType && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        columnType === 'numeric'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {columnType}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedTarget}
              className={`px-8 py-3 text-lg transition-all duration-300 ${
                selectedTarget
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Continue to Training
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
            {selectedTarget && (
              <p className="text-sm text-gray-600 mt-2 animate-fade-in">
                Selected target: <span className="font-medium text-blue-600">{selectedTarget}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TargetSelection;

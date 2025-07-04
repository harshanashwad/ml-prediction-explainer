
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadCSV } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

const FileUpload = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadCSV(file);
      setUploadedFile(file);
      onUploadSuccess(response);
      toast({
        title: "File uploaded successfully!",
        description: `${file.name} has been processed.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.detail || "Failed to upload file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Upload className="h-6 w-6 text-blue-600" />
            Upload Your Dataset
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Upload a CSV file to start training your ML model and generate explanations
          </p>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : uploadedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-blue-500 rounded-full mx-auto mb-4 animate-spin border-4 border-blue-200 border-t-blue-500"></div>
                <p className="text-blue-600 font-medium">Uploading and processing...</p>
              </div>
            ) : uploadedFile ? (
              <div className="animate-fade-in">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-700 font-medium mb-2">File uploaded successfully!</p>
                <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  {uploadedFile.name}
                </p>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-gray-500 mb-4">or</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!uploadedFile && (
            <div className="mt-6 text-sm text-gray-500">
              <h4 className="font-medium mb-2">Requirements:</h4>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                  File format: CSV (.csv)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                  Include column headers
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                  Tabular data with a target variable
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;


import { StepsProps } from "@/lib/validations/bookng-modal";
import { FileCheck, Upload, X } from "lucide-react";
import React, { useCallback, useState } from "react";


export const Step3Checklist = ({ formData, setFormData }: StepsProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files) {
        const newFiles = Array.from(files);
        setFormData((prev) => ({
          ...prev,
          checklistFile: [...(prev.checklistFile || []), ...newFiles],
        }));
      }
    },
    [setFormData]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (fileToRemove: File) => {
    setFormData((prev) => ({
      ...prev,
      checklistFile: prev.checklistFile?.filter(
        (file) => file !== fileToRemove
      ),
    }));
  };

  // Drag and Drop handlers
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Upload Your Cleaning Checklist(s)
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          This is mandatory to ensure a perfect turnover every time. You can
          upload multiple files if needed.
        </p>
      </div>

      {/* List of uploaded files */}
      {formData.checklistFile && formData.checklistFile.length > 0 && (
        <div className="space-y-2">
          {formData.checklistFile.map((file, index) => (
            <div
              key={index}
              className="w-full bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center overflow-hidden">
                <FileCheck className="h-6 w-6 text-teal-500 flex-shrink-0" />
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(file)}
                className="text-gray-400 hover:text-gray-600 ml-2 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
          isDragging ? "border-teal-500 bg-teal-50" : "border-gray-300"
        } border-dashed rounded-md transition-colors`}
      >
        <div className="space-y-1 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500"
            >
              <span>Upload files</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={onFileChange}
                accept=".pdf,.doc,.docx,.txt"
                multiple
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PDF, DOCX, TXT up to 10MB</p>
        </div>
      </div>
    </div>
  );
};

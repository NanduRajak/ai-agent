import {
  CopyCheckIcon,
  CopyIcon,
  EditIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code-view";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbEllipsis,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./tree-view";

type FileCollection = { [path: string]: string };

function getLanguageFromExtension(filename: string): string {
  const ext = filename.split(".").pop();
  const extension = ext ? ext.toLowerCase() : "";

  // Map file extensions to language identifiers
  const extensionMap: { [key: string]: string } = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sql: "sql",
  };

  return extensionMap[extension] || "text";
}

interface FileBreadCrumbProps {
  filePath: string;
}

const FileBreadCrumb = ({ filePath }: FileBreadCrumbProps) => {
  const pathSegments = filePath.split("/");
  const maxSegments = 4;
  const renderBreadcrumItems = () => {
    if (pathSegments.length <= maxSegments) {
      // Show all segment if 4 or less
      return pathSegments.map((segment, index) => {
        const isList = index === pathSegments.length - 1;

        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isList ? (
                <BreadcrumbPage className="font-medium">
                  {segment}
                </BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{segment}</span>
              )}
            </BreadcrumbItem>
            {!isList && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      const firstSegment = pathSegments[0];
      const lastSegment = pathSegments[pathSegments.length - 1];
      return (
        <>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstSegment}</span>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-medium">
                {lastSegment}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbItem>
        </>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>{renderBreadcrumItems()}</BreadcrumbList>
    </Breadcrumb>
  );
};
interface FileExplorerProps {
  files: FileCollection;
  onFilesUpdate?: (updatedFiles: FileCollection) => void;
}

export const FileExplorer = ({ files, onFilesUpdate }: FileExplorerProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const treeData = useMemo(() => {
    return convertFilesToTreeItems(files);
  }, [files]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (files[filePath]) {
        if (isEditing) {
          setIsEditing(false);
          setEditedContent("");
        }
        setSelectedFile(filePath);
      }
    },
    [files, isEditing]
  );

  const handleCopy = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [selectedFile, files]);

  const handleEdit = useCallback(() => {
    if (selectedFile) {
      setEditedContent(files[selectedFile]);
      setIsEditing(true);
    }
  }, [selectedFile, files]);

  const handleSave = useCallback(() => {
    if (selectedFile && onFilesUpdate) {
      const updatedFiles = { ...files, [selectedFile]: editedContent };
      onFilesUpdate(updatedFiles);
      setIsEditing(false);
      setEditedContent("");
    }
  }, [selectedFile, files, editedContent, onFilesUpdate]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedContent("");
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
        <TreeView
          data={treeData}
          value={selectedFile}
          onSelect={handleFileSelect}
        />
      </ResizablePanel>
      <ResizableHandle className="hover:bg-primary transition-colors" />
      <ResizablePanel defaultSize={70} minSize={50}>
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
              <FileBreadCrumb filePath={selectedFile} />
              <div className="flex items-center gap-x-2">
                {isEditing ? (
                  <>
                    <Hint text="Save changes" side="bottom">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSave}
                        disabled={!onFilesUpdate}
                      >
                        <SaveIcon />
                      </Button>
                    </Hint>
                    <Hint text="Cancel editing" side="bottom">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCancel}
                      >
                        <XIcon />
                      </Button>
                    </Hint>
                  </>
                ) : (
                  <>
                    <Hint text="Edit file" side="bottom">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleEdit}
                        disabled={!onFilesUpdate}
                      >
                        <EditIcon />
                      </Button>
                    </Hint>
                    <Hint text="Copy to clipboard" side="bottom">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        disabled={copied}
                      >
                        {copied ? <CopyCheckIcon /> : <CopyIcon />}
                      </Button>
                    </Hint>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="h-full w-full resize-none border-none rounded-none font-mono text-xs"
                  placeholder="Edit your code here..."
                />
              ) : (
                <CodeView
                  code={files[selectedFile]}
                  lang={getLanguageFromExtension(selectedFile)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a file to view it&apos;s content
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

import React, { useRef, useState } from "react";

import { EditorInput } from "../EditorInput/EditorInput";
import { Input, TooltipPosition } from "../types";
import { Tooltip } from "../Tooltip/Tooltip";
import { useSmartConfig } from "../hook/useSmartConfig";
import { renderIcon, translateText, withSlot } from "../Utils/styling";

interface FilePropTypes {
  id?: string;
  name?: string;
  placeholder?: string;
  maxFilesPlaceholder?: number;
  fileUrlDownload?: string;
  fileDownloadName?: string;
  editorAttributes: Record<string, any>;
  onDownloadFileClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onDeleteFileClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onBlurEvent?: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  onChangeEvent?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  inputRef: React.MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  className?: string;
  /** Per-instance class overrides (merged after the configured classes). */
  slotClassNames?: { inputGroup?: string; icon?: string };
  /**
   * ARIA mode (`behavior.accessibility.aria`): the upload/delete/download
   * controls get `role="button"`, `tabIndex=0`, an `aria-label` and
   * Enter/Space activation.
   */
  accessible?: boolean;
}

export function File(props: FilePropTypes) {
  const config = useSmartConfig();
  const {
    name,
    placeholder = translateText(
      config,
      "file.placeholder",
      config.behavior.file.filePlaceholderText
    ),
    editorAttributes,
    maxFilesPlaceholder = config.behavior.file.maxFilesPlaceholder,
    fileUrlDownload,
    fileDownloadName,
    onDownloadFileClick,
    onDeleteFileClick,
    onBlurEvent,
    onChangeEvent,
    inputRef,
    className,
    slotClassNames = {},
    accessible = false,
  } = props;
  const [fileName, setFileName] = useState<string>();
  const inputUploadRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(null);
  const editorClasses = config.components.editor.classes;
  const icons = config.resources.icons;

  const finalInputRef = inputRef || inputUploadRef;
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    let fileNames;
    if (files.length > maxFilesPlaceholder) {
      fileNames = `${files.length} ${translateText(
        config,
        "file.texts.totalSelectedFiles",
        config.resources.fileTexts.totalSelectedFiles
      )}`;
    } else {
      const fileNamesArray = [];
      for (let i = 0; i < files.length; i++) {
        fileNamesArray.push(files[i].name);
      }
      fileNames = fileNamesArray.join(", ");
    }
    setFileName(fileNames);
    if (onChangeEvent) {
      onChangeEvent(event);
    }
  };
  const handleUploadClick = () => {
    finalInputRef.current.click();
  };
  function extractFileName(url) {
    const lastSlashIndex = url.lastIndexOf("/");
    const fileName = url.substring(lastSlashIndex + 1);
    return fileName;
  }

  const fileTexts: Record<string, string> = config.resources.fileTexts as any;
  const buttonText = (key: "uploadLabel" | "deleteLabel" | "downloadLabel", fallback: string) =>
    translateText(config, `file.texts.${key}`, fileTexts[key] ?? fallback);
  /**
   * Accessibility of an icon button: a visible text when the icon is `false`
   * (nothing would be rendered otherwise), and — in ARIA mode — button
   * semantics with an accessible name and keyboard activation.
   */
  const buttonProps = (label: string, onActivate?: (event: any) => void) =>
    accessible
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": label,
          onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onActivate?.(event);
            }
          },
        }
      : {};
  const iconOrText = (icon: any, label: string) =>
    icon === false ? label : renderIcon(icon);

  const handleBlurEvent = async (event: React.FocusEvent<HTMLInputElement>) => {
    if (onBlurEvent) {
      let files: FileList | null;
      if (
        finalInputRef &&
        finalInputRef.current &&
        finalInputRef.current instanceof HTMLInputElement
      ) {
        files = finalInputRef.current.files;
      }
      const event = {
        target: {
          name: name,
          files: files as unknown as FileList,
        },
      };
      onBlurEvent(event as React.FocusEvent<HTMLInputElement>);
    }
  };

  const handleDownloadClick = () => {
    const link = document.createElement("a");
    link.href = fileUrlDownload;
    link.target = "_blank";
    let urlFileName = fileDownloadName;
    if (!fileDownloadName) {
      urlFileName = extractFileName(fileUrlDownload);
    }
    if (urlFileName) {
      link.download = urlFileName;
    }
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDeleteClick = () => {
    setFileName("");
    if (finalInputRef && finalInputRef.current) {
      finalInputRef.current.value = "";
    }
    const event = {
      target: {
        name: name,
        files: [] as unknown as FileList,
      },
    };
    handleFileChange(event as React.ChangeEvent<HTMLInputElement>);
  };
  const inputAttributes: Record<string, string> = {};
  inputAttributes["type"] = "text";
  inputAttributes["readOnly"] = "readOnly";
  if (placeholder) {
    inputAttributes["placeholder"] = placeholder;
  }
  inputAttributes["defaultValue"] = fileName;
  if (accessible) {
    // ARIA mode: the visible text box is described by the note / messages too
    if (editorAttributes?.["aria-describedby"]) {
      inputAttributes["aria-describedby"] = editorAttributes["aria-describedby"];
    }
    if (editorAttributes?.["aria-invalid"]) {
      inputAttributes["aria-invalid"] = editorAttributes["aria-invalid"];
    }
  }

  const input = (
    <EditorInput
      type={Input.Text}
      inputType="input"
      editorAttributes={inputAttributes}
      onBlurEvent={handleBlurEvent}
      className={className}
    ></EditorInput>
  );
  const { value, ...restEditorAttributes } = editorAttributes;

  const inputUpload = (
    <EditorInput
      type={Input.File}
      inputType="input"
      editorAttributes={restEditorAttributes}
      inputRef={finalInputRef}
      onChangeEvent={handleFileChange}
      style={{ display: "none" }}
    ></EditorInput>
  );

  const deleteIconComponent =
    onDeleteFileClick || fileName ? (
      <Tooltip
        position={TooltipPosition.Top}
        text={translateText(
          config,
          "file.texts.deleteTooltip",
          config.resources.fileTexts.deleteTooltip
        )}
      >
        <div
          className={editorClasses.inputGroupAppendFile}
          onClick={fileName ? handleDeleteClick : onDeleteFileClick}
          {...buttonProps(
            buttonText("deleteLabel", "Remove file"),
            fileName ? handleDeleteClick : onDeleteFileClick
          )}
        >
          <span
            className={withSlot(
              config,
              editorClasses.inputGroupFileDeleteIcon,
              slotClassNames.icon
            )}
          >
            {iconOrText(icons.delete, buttonText("deleteLabel", "Remove file"))}
          </span>
        </div>
      </Tooltip>
    ) : null;
  const downloadIconComponent =
    fileUrlDownload || onDownloadFileClick ? (
      <Tooltip
        position={TooltipPosition.Top}
        text={translateText(
          config,
          "file.texts.downloadTooltip",
          config.resources.fileTexts.downloadTooltip
        )}
      >
        <div
          className={editorClasses.inputGroupAppendFile}
          onClick={onDownloadFileClick ?? handleDownloadClick}
          {...buttonProps(
            buttonText("downloadLabel", "Download file"),
            onDownloadFileClick ?? handleDownloadClick
          )}
        >
          <span
            className={withSlot(
              config,
              editorClasses.inputGroupFileDownloadIcon,
              slotClassNames.icon
            )}
          >
            {iconOrText(
              icons.download,
              buttonText("downloadLabel", "Download file")
            )}
          </span>
        </div>
      </Tooltip>
    ) : null;
  const uploadIconComponent = (
    <Tooltip
      position={TooltipPosition.Top}
      text={translateText(
        config,
        "file.texts.uploadTooltip",
        config.resources.fileTexts.uploadTooltip
      )}
    >
      <div
        className={editorClasses.inputGroupAppendFile}
        onClick={handleUploadClick}
        {...buttonProps(buttonText("uploadLabel", "Choose file"), handleUploadClick)}
      >
        <span
          className={withSlot(
            config,
            editorClasses.inputGroupFileUploadIcon,
            slotClassNames.icon
          )}
        >
          {iconOrText(icons.upload, buttonText("uploadLabel", "Choose file"))}
        </span>
      </div>
    </Tooltip>
  );
  const optionsGroup = React.createElement(
    "div",
    {
      className: withSlot(
        config,
        editorClasses.inputGroup,
        slotClassNames.inputGroup
      ),
    },
    input,
    deleteIconComponent,
    downloadIconComponent,
    uploadIconComponent,
    inputUpload
  );

  return optionsGroup;
}

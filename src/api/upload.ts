import service from './request';
export const UPLOAD_BASE = '/basic-resource/oss'
// 通过文件和文件MD5标识校验文件是否已存在（秒传）
export const checkFileExists = (file, identifier, signal) =>
    service({
        url: UPLOAD_BASE + "/upload-check",
        method: "POST",
        contentType: "application/json",
        signal,
        data: {
            fileName: file.name,
            identifier: identifier,
            fileSize: file.size,
            contentType: file.type,
            totalSize: file.size,
            chunkSize: 5 * 1024 * 1024,
            chunkNum: Math.ceil(file.size / (5 * 1024 * 1024)),
        },
    });
// 小文件上传
export const uploadSmallFileApi = (data, signal) =>
    service({
        url: UPLOAD_BASE + "/upload",
        method: "POST",
        contentType: "application/json",
        signal,
        data,
    });
// 大文件上传
export const uploadLargeFileApi = (data, identifier, i, signal) =>
    service({
        url: UPLOAD_BASE + `/upload-part/${identifier}/${i}`,
        method: "POST",
        contentType: "multipart/form-data",
        signal,
        data,
    });
// 大文件合并
export const mergeFileChunksApi = (data, signal) =>
    service({
        url: UPLOAD_BASE + `/merge-file-chunk`,
        method: "POST",
        contentType: "application/json",
        signal,
        data,
    });
// 文件删除
export const deleteFileApi = (identifier:any) =>
    service({
        url: UPLOAD_BASE + `/delete-upload-progress/` + identifier,
        method: 'DELETE',
    });
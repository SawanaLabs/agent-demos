export function convertFilesToParts(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<{
          filename: string;
          mediaType: string;
          type: "file";
          url: string;
        }>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            const result = reader.result;

            if (typeof result !== "string") {
              reject(new Error(`Failed to read ${file.name} as a data URL.`));
              return;
            }

            resolve({
              filename: file.name,
              mediaType: file.type || "application/octet-stream",
              type: "file",
              url: result,
            });
          };

          reader.onerror = () => {
            reject(new Error(`Failed to read ${file.name} as a data URL.`));
          };

          reader.readAsDataURL(file);
        })
    )
  );
}

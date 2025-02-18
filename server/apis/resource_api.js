const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  ListBucketsCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Retrieves all S3 resources (objects) from the specified bucket.
async function getS3Resources(profile) {
  if (!profile || !profile.credentials) {
    return { success: false, message: "No profile or credentials available." };
  }

  try {
    const s3Client = new S3Client({
      region: profile.region,
      credentials: profile.credentials,
    });

    const listParams = {
      Bucket: profile.bucketName,
    };

    const listCommand = new ListObjectsV2Command(listParams);
    const listResponse = await s3Client.send(listCommand);

    let resources = [];

    if (listResponse.Contents) {
      for (const obj of listResponse.Contents) {
        const getObjectParams = {
          Bucket: profile.bucketName,
          Key: obj.Key,
        };

        try {
          const getObjectCommand = new GetObjectCommand(getObjectParams);
          const getObjectResponse = await s3Client.send(getObjectCommand);

          const contentType = getObjectResponse.ContentType;
          const isImage = contentType && contentType.startsWith("image/");

          let src;
          if (isImage) {
            try {
              // Convert the image data to a base64-encoded data URL.
              const blob = await getObjectResponse.Body.transformToByteArray();
              const buffer = Buffer.from(blob);
              const base64Image = buffer.toString("base64");
              src = `data:${contentType};base64,${base64Image}`;
            } catch (blobError) {
              console.error("Error processing image:", blobError);
              src = null;
            }
          } else {
            src = null;
          }

          resources.push({
            name: obj.Key,
            type: isImage ? "image" : "file",
            src: src,
          });
        } catch (getObjectError) {
          // If getting an individual object fails, continue to the next one.
        }
      }
    }

    return { success: true, resources };
  } catch (error) {
    console.error("Error in getS3Resources:", error);
    return { success: false, message: error.message };
  }
}

// Lists all buckets and their contents.
async function listAllBucketsAndContents(profile) {
  if (!profile || !profile.credentials) {
    return { success: false, message: "No profile or credentials available." };
  }

  try {
    const s3Client = new S3Client({
      region: profile.region,
      credentials: profile.credentials,
    });

    const listBucketsCommand = new ListBucketsCommand({});
    const listBucketsResponse = await s3Client.send(listBucketsCommand);

    let bucketData = [];

    if (listBucketsResponse.Buckets) {
      for (const bucket of listBucketsResponse.Buckets) {
        const bucketName = bucket.Name;
        const contents = await getBucketContents(s3Client, bucketName);
        bucketData.push({ bucketName, contents });
      }
    }

    return { success: true, bucketData };
  } catch (error) {
    console.error("Error listing buckets and contents:", error);
    return { success: false, message: error.message };
  }
}

// Helper function: retrieves the contents (object keys) of a bucket.
async function getBucketContents(s3Client, bucketName) {
  const listParams = {
    Bucket: bucketName,
  };

  const listCommand = new ListObjectsV2Command(listParams);
  const listResponse = await s3Client.send(listCommand);

  let contents = [];
  if (listResponse.Contents) {
    for (const obj of listResponse.Contents) {
      contents.push(obj.Key);
    }
  }
  return contents;
}

// Removes (deletes) an S3 resource (object) from a bucket.
async function removeS3Resource(profile, bucketName, objectName) {
  if (!profile || !profile.credentials) {
    return { success: false, message: "No profile or credentials available." };
  }

  if (!bucketName || !objectName) {
    return {
      success: false,
      message: "Bucket name and object key are required.",
    };
  }

  try {
    const s3Client = new S3Client({
      region: profile.region,
      credentials: profile.credentials,
    });

    const deleteParams = {
      Bucket: bucketName,
      Key: objectName,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3Client.send(deleteCommand);

    return {
      success: true,
      message: `Object '${objectName}' deleted successfully from bucket '${bucketName}'.`,
    };
  } catch (error) {
    console.error("Error in removeS3Resource:", error);
    return { success: false, message: error.message };
  }
}

// Adds (uploads) an S3 resource to a bucket and returns a presigned URL for the object.
async function addS3Resource(
  profile,
  bucketName,
  objectKey,
  fileContent,
  contentType
) {
  if (!profile || !profile.credentials) {
    return { success: false, message: "No profile or credentials available." };
  }

  if (!bucketName || !objectKey || !fileContent) {
    return {
      success: false,
      message: "Bucket name, object key, and file content are required.",
    };
  }

  try {
    const s3Client = new S3Client({
      region: profile.region,
      credentials: profile.credentials,
    });

    const putParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ContentType: contentType,
    };

    const putCommand = new PutObjectCommand(putParams);
    await s3Client.send(putCommand);

    const getObjectParams = {
      Bucket: bucketName,
      Key: objectKey,
    };
    const getCommand = new GetObjectCommand(getObjectParams);
    // Generate a presigned URL that expires in 1 hour.
    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    });

    return {
      success: true,
      message: `Object '${objectKey}' uploaded successfully to bucket '${bucketName}'.`,
      presignedUrl,
    };
  } catch (error) {
    console.error("Error in addS3Resource:", error);
    return { success: false, message: error.message };
  }
}

/*
  // main for testing
  
  // This sample main function demonstrates how you might test these functions locally.
  // It includes example profiles and test cases for listing buckets, adding resources,
  // and performing a compliance check.
  // Note: Replace any dummy values with your own test credentials or load them securely,
  // e.g. via environment variables.
  // 
  // async function main() {
  //     const testProfile = {
  //         region: "us-east-2",
  //         credentials: {
  //             accessKeyId: "YOUR_TEST_ACCESS_KEY_ID",   // Replace with your test key or use env variables
  //             secretAccessKey: "YOUR_TEST_SECRET_ACCESS_KEY",   // Replace with your test secret
  //             sessionToken: "YOUR_TEST_SESSION_TOKEN",  // Replace with your test session token
  //         },
  //         bucketName: "puppy-pics-s3"
  //     }
  //
  //     try {
  //         // List buckets and contents
  //         const result = await listAllBucketsAndContents(testProfile);
  //         if (result.success) {
  //             console.log("Bucket Data:", JSON.stringify(result.bucketData, null, 2));
  //         } else {
  //             console.error("Error:", result.message);
  //         }
  //
  //         // Get resources in a bucket
  //         const resourcesResult = await getS3Resources(testProfile);
  //         if (resourcesResult.success) {
  //             console.log("Resources Data:", JSON.stringify(resourcesResult.resources, null, 2));
  //         } else {
  //             console.error("Error:", resourcesResult.message);
  //         }
  //
  //         // Test adding a text file
  //         const addTextResult = await addS3Resource(
  //             testProfile,
  //             "puppy-pics-s3",
  //             "test.txt",          // Object key (file name)
  //             "This is a test text file.",  // File content
  //             "text/plain"      // MIME type for text files
  //         );
  //         if (addTextResult.success) {
  //             console.log(addTextResult.message);
  //             console.log("Presigned URL:", addTextResult.presignedUrl);
  //         } else {
  //             console.error("Error adding text file:", addTextResult.message);
  //         }
  //
  //         // Test adding an image (you'll need to provide the actual image data)
  //         const imagePath = 'C:\\Users\\Brayden\\Downloads\\testImage5.jpg';
  //         const imageBuffer = require('fs').readFileSync(imagePath);
  //         const addImageResult = await addS3Resource(
  //             testProfile,
  //             "puppy-pics-s3",      // Your bucket
  //             "testImage5.jpg",  // Object key
  //             imageBuffer,      // Image data (as a Buffer)
  //             "image/jpg"      // MIME type (image/jpeg, image/gif, etc.)
  //         );
  //         if (addImageResult.success) {
  //             console.log(addImageResult.message);
  //             console.log("Presigned URL:", addImageResult.presignedUrl);
  //         } else {
  //             console.error("Error adding image file:", addImageResult.message);
  //         }
  //
  //         // Test removing a resource
  //         const removeResult = await removeS3Resource(testProfile, "puppy-pics-s3", "test.txt"); // Replace with your object key
  //         if (removeResult.success) {
  //             console.log(removeResult.message);
  //         } else {
  //             console.error("Error:", removeResult.message);
  //         }
  //
  //         console.log('\nAttempting compliance check...');
  //         const compliance = await getBucketCompliance(
  //             testProfile.credentials.accessKeyId,
  //             testProfile.credentials.secretAccessKey,
  //             testProfile.credentials.sessionToken,
  //             'puppy-pics-s3'
  //         );
  //         console.log(compliance);
  //
  //     } catch (error) {
  //         console.error("Main function error:", error);
  //     }
  // }
  //
  // if (require.main === module) {
  //     main();
  // }
  */

module.exports = {
  getS3Resources,
  removeS3Resource,
  addS3Resource,
  listAllBucketsAndContents,
};

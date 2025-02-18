const { 
    S3Client, 
    ListObjectsV2Command, 
    GetObjectCommand, 
    ListBucketsCommand, 
    DeleteObjectCommand, 
    PutObjectCommand,
    GetBucketPolicyCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

                    let src = null;
                    if (isImage) {
                        try {
                            const blob = await getObjectResponse.Body.transformToByteArray();
                            const buffer = Buffer.from(blob);
                            const base64Image = buffer.toString("base64");
                            src = `data:${contentType};base64,${base64Image}`;
                        } catch (blobError) {
                            console.error("Error processing image:", blobError);
                        }
                    }

                    resources.push({
                        name: obj.Key,
                        type: isImage ? "image" : "file",
                        src: src,
                    });

                } catch (getObjectError) {
                    console.error("Error retrieving object:", getObjectError);
                }
            }
        }

        return { success: true, resources };
    } catch (error) {
        console.error("Error in getS3Resources:", error);
        return { success: false, message: error.message };
    }
}

async function getProfileCompliance(accessKeyId, secretAccessKey, sessionToken) {
    if (!accessKeyId || !secretAccessKey || !sessionToken) {
        return { compliant: false, msg: "Error: Missing AWS credentials." };
    }

    const credentials = { accessKeyId, secretAccessKey, sessionToken };
    const s3Client = new S3Client({ region: "us-east-2", credentials });

    try {
        console.log("Checking profile compliance...");

        const { Buckets } = await s3Client.send(new ListBucketsCommand({}));

        if (!Buckets || Buckets.length === 0) {
            return { compliant: true, msg: "Profile is compliant (No buckets found)." };
        }

        console.log(`Found ${Buckets.length} buckets. Checking public access policies...`);

        let nonCompliantBuckets = [];

        for (const bucket of Buckets) {
            const bucketName = bucket.Name;
            console.log(`Checking bucket: ${bucketName}`);

            try {
                await s3Client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
                nonCompliantBuckets.push({ bucket: bucketName, issue: "Public access policy detected" });
            } catch (err) {
                if (err.name === "NoSuchBucketPolicy") {
                    console.log(`${bucketName} has no public policy.`);
                } else {
                    console.warn(`Unable to check policy for ${bucketName}: ${err.message}`);
                }
            }
        }

        if (nonCompliantBuckets.length > 0) {
            return {
                compliant: false,
                msg: "Some buckets have public access policies.",
                details: nonCompliantBuckets
            };
        }

        return { compliant: true, msg: "All buckets are compliant (No public access policies found)." };

    } catch (e) {
        console.error("AWS Compliance Check Error:", e);
        return { msg: `Error: ${e.message || "Unknown error"}`, compliant: false };
    }
}

async function getBucketContents(s3Client, bucketName) {
    const listParams = {
        Bucket: bucketName,
    };

    try {
        const listCommand = new ListObjectsV2Command(listParams);
        const listResponse = await s3Client.send(listCommand);

        let contents = [];
        if (listResponse.Contents) {
            for (const obj of listResponse.Contents) {
                contents.push(obj.Key);
            }
        }
        return contents;
    } catch (error) {
        console.error(`Error retrieving contents for bucket ${bucketName}:`, error);
        return null;
    }
}

async function removeS3Resource(profile, bucketName, objectName) {
    if (!profile || !profile.credentials) {
        return { success: false, message: "No profile or credentials available." };
    }

    if (!bucketName || !objectName) {
        return { success: false, message: "Bucket name and object key are required." };
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

        return { success: true, message: `Object '${objectName}' deleted successfully from bucket '${bucketName}'.` };
    } catch (error) {
        console.error("Error in removeS3Resource:", error);
        return { success: false, message: error.message };
    }
}

async function addS3Resource(profile, bucketName, objectKey, fileContent, contentType) {
    if (!profile || !profile.credentials) {
        return { success: false, message: "No profile or credentials available." };
    }

    if (!bucketName || !objectKey || !fileContent) {
        return { success: false, message: "Bucket name, object key, and file content are required." };
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
        const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

        return { success: true, message: `Object '${objectKey}' uploaded successfully to bucket '${bucketName}'.`, presignedUrl };
    } catch (error) {
        console.error("Error in addS3Resource:", error);
        return { success: false, message: error.message };
    }
}

async function getProfileCompliance(accessKeyId, secretAccessKey, sessionToken) {
    if (!accessKeyId || !secretAccessKey || !sessionToken) {
      return { compliant: false, msg: " Error. Missing AWS credentials." };
    }
  
    const credentials = { accessKeyId, secretAccessKey, sessionToken };
  
    try {
      const s3Client = new S3Client({ region: "us-east-2", credentials });
  
      console.log("🛠️ Testing compliance by listing S3 buckets...");
      await s3Client.send(new ListBucketsCommand({}));
  
      console.log(" Profile is compliant.");
      return { msg: "Access Granted", compliant: true };
    } catch (e) {
      console.error(" AWS Compliance Check Error:", e);
  
      if (e.name === "AccessDenied" || e.message.includes("AccessDenied")) {
        console.log(" Profile is NON-COMPLIANT due to access denial.");
        return { msg: "Access Denied", compliant: false };
      }

      console.log("Profile compliance check failed due to an unknown error.");
      return { msg: `Error: ${e.message || "Unknown error"}`, compliant: false };
    }
  }



/* 
 * Main for testing 
 * (Kept as is, with no modifications)
 */
if (require.main === module) {
    main();
}

// Ensure all functions are properly exported
module.exports = { 
    getS3Resources, 
    removeS3Resource, 
    addS3Resource, 
    getProfileCompliance 
};
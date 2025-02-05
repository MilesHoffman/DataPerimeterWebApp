
const { S3Client, ListObjectsV2Command, GetObjectCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");





async function getS3Resources(profile) {
    if (!profile ||!profile.credentials) {
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

        let resources =[];

        if (listResponse.Contents) {
            for (const obj of listResponse.Contents) {
                const getObjectParams = {
                    Bucket: profile.bucketName,
                    Key: obj.Key,
                };
                const getObjectCommand = new GetObjectCommand(getObjectParams);
                const getObjectResponse = await s3Client.send(getObjectCommand);

                const contentType = getObjectResponse.ContentType;
                const isImage = contentType && contentType.startsWith('image/');

                let src;
                if (isImage) {
                    const blob = await getObjectResponse.Body.transformToByteArray();
                    src = URL.createObjectURL(new Blob([blob], { type: contentType }));
                } else {
                    const blob = await getObjectResponse.Body.transformToByteArray();
                    src = URL.createObjectURL(new Blob([blob], { type: contentType }));
                }

                resources.push({
                    name: obj.Key,
                    type: isImage? 'image': 'file',
                    src: src,
                });
            }
        }

        return { success: true, resources };

    } catch (error) {
        console.error("Error in getS3Resources:", error);
        return { success: false, message: error.message };
    }
}

async function listAllBucketsAndContents(profile) {
    if (!profile ||!profile.credentials) {
        return { success: false, message: "No profile or credentials available." };
    }

    try {
        const s3Client = new S3Client({
            region: profile.region,
            credentials: profile.credentials,
        });

        const listBucketsCommand = new ListBucketsCommand({});
        const listBucketsResponse = await s3Client.send(listBucketsCommand);

        let bucketData =[];

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

async function getBucketContents(s3Client, bucketName) {
    const listParams = {
        Bucket: bucketName,
    };

    const listCommand = new ListObjectsV2Command(listParams);
    const listResponse = await s3Client.send(listCommand);

    let contents =[];
    if (listResponse.Contents) {
        for (const obj of listResponse.Contents) {
            contents.push(obj.Key);
        }
    }
    return contents;
}
//test
async function main() {

   //test profile
    const testProfile = {
        region: "us-east-2",
        credentials: {
            accessKeyId: 'ASIAVIOZFWO2D7HQ5NPL',
            secretAccessKey: 'qiunKagKzMSxsLj1VhAFMbsLHFHSY5F7HZpBD44c',
            sessionToken: 'IQoJb3JpZ2luX2VjEDAaCXVzLWVhc3QtMiJHMEUCIQD1FJ+iqGXdHp40BMk8NczC0ToKYBZiitvZMb3fVCiNiwIgYUDbA0eDskL6OvfabrlRlhD9SgsSeY/m+bXeRvLvfOYqxAQISRAAGgwzNjE3Njk1Nzk0NDQiDPz05ma+VIh7VCsupCqhBIdCGmaAKalIZe4TQnIXuw3e/fA7a2XE75KA1Hlhkgigf8cK2vBDIFKZ8Ij2ikNR3A7niCzjBpw+olEw9NcvYB8tKgd7tq2DoXI2V9rosRdek3fP+W5bpuhm87quymzCfR53HOPIZbkbfK9yCGjLEOuyVzpd/y76KOIyFmzMbZsXWvxmvbNy6WDvHeinXr4tpPfIs83H+xjE/JlBpU6jI+0SyJorQjqPv+TsTD11td5VtN/Oe84not7Nw0HtHl05XgTL3brSANJ3XbBS0EdLUlMgyI9Yv0CnMbsSqBctqstb/wuoo8sCle9YSgUplZA7/Yz9+vIOeH2AEj6yyljTDOTfbhLqtyKEHH9gDZ/moGA1nw9GBbX0l112lOba85JNaACknuUilKrtlIaCaC/ol+wK4QOsuP+l9339/O6V8r2PZLSa1XpHe0COXHXO5hHjSnfoQY5sLnC5jkHNHLCZ5LNHmJOZlia/htkOQNLDncb13CDva0n+UMoChdHAN9pHJ/R9SGWHCB+MCUwHq4LoBYxCBVj5ielFn4FPhbsBUc2ZOghGDQ5jTjR5YOnLfiOIlEleYcagGAVD0NpWE/BCBxv5HJ7We9Nqzv4p6+8JGfiPgLoAsG04wP3Z5qzn+C5FTkRcXWmTEaz+ywEeiVnhyhqVIrf8ymRYXOnqbPxMQby06lCStLEbrXFEC5L3VjKAk96K7gbejleonjkhipBu5plZMMCUjr0GOoUCnznt9NS4GLehnGsyFG0laX214tDu/hAhyt1uyL+KywoEyZqWfIRZDeJU9owyB/cmdTsoy4OYW2tZMQDytylz+hBmbgM6WaR9J/89YW0cCp98UlXcs69fm8XXrfexfddPdYpeXTziEeJG1yJrVluHNdQtvmG1/jmlGxM964jm2o/yuBSWVW6LK23v8w3HygZReXg9B87khU6b8u+8agH3pWX/bTZoumux2VdYD0Z8PBJUiHhSSk5lafiiZxgQS92D7cX86IVucodWJdDN9hFOz416YvIdI3Bxg9sQ2XxtKKs5Qug+TxH7YZC3kFynI74tsnjij5GRKu8Wyx5Ow40dd1Z0t10W'

},
        bucketName: "puppy-pics-s3"
    };

    try {
        const result = await listAllBucketsAndContents(testProfile);
        if (result.success) {
            console.log("Bucket Data:", JSON.stringify(result.bucketData, null, 2));
        } else {
            console.error("Error:", result.message);
        }

        const resourcesResult = await getS3Resources(testProfile);
        if (resourcesResult.success) {
            console.log("Resources Data:", JSON.stringify(resourcesResult.resources, null, 2));
        } else {
            console.error("Error:", resourcesResult.message);
        }

    } catch (error) {
        console.error("Main function error:", error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getS3Resources };
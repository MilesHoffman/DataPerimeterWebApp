
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

async function main() {

    const testProfile = {
        region: "us-east-2",
        credentials: {
            accessKeyId: 'ASIAVIOZFWO2ICG57MKK',
            secretAccessKey: 'q0PwxSHXvjRi8/DPhbeLVq4tvn3gvZyTbfEMYTIn',
            sessionToken: 'IQoJb3JpZ2luX2VjEA0aCXVzLWVhc3QtMiJHMEUCIDbgGYoLHKgSeS2iHlk7DbbMaFRXnovX3iwbtI5UEwaXAiEA4ffU7s1m5QA3KJqYkW7EnTflKRORRg8gv32L0uUGe0MqxAQIJhAAGgwzNjE3Njk1Nzk0NDQiDN//pL/0y+XLyLXEUyqhBJI6lC8iS7AOfS64zUZlJj2FIalh1ye7oDWR8qT7T2ygzBh0n//8zTkf3uIK7oXCBaHBgkVTmnZvsD5e056EnntNQ6GLWXX3WLyy/9M602Gk4tnxktCunj7Ag7TJ4CFLoP8QeUMrRCxC5ZIaeqxiKD06DLggJxqYDr+LRUP/+Q4DWJ9mHY24GMWjnlFbonBz/zG6zy0bzxV7pKNiJJYnYcPH999V/9/A0B3Rh+4Q5q7T+1zhmJK0I5jwQ+10wWQZTZv7Fka53P8i9oEXcactcJIZTNqF1cO0CZrP03c81AFCMG+iD0eQCpPjOV/fd+KlL/l4cBTOhjug44+zjxk86hD0G1cxYZOTds/n4d/ezIwQ98c8k3LahWrKGYFIOd4Lo1LgZd0CndOD5mXzG4TNwaKjXacftBjbDyI8G9aNogdAJQ055HbrOI8e6CbtQhZvpKP6XZ5Z3IUtDSe8DnfU0qpDPdjQJcQ7maPgam+3FmIhDUq4FNPkKNMa1FC8y2WyX/pmOEhP6GFv6yPbLK3Vq3XhoYw0lJPsU2XslSsQuC1pd7UA3i1SceG0Ju4u3W/gn5C6GJTNETgIvgqYzFgSVc7C6jScLrxukU3H+i0s/Ohy6SZIbNF+F+LCJtvJ+ZigIE9fACyDwrfGj2TKvmO+g05WukaR1UnMol+v23slc9z5SfhnYc6JHe58sdcqzE1s5tUKEckogt20+5SnuqKrdQ5qMM22hr0GOoUCh1yx0Yc6rHE7GLNrDEE6x7rGgTkEJaldtgtptZnNVhla/Ar9CfIaMwJQgDXLfVJ2R4dXF7DO2yPNiS1N2U3sBkYCnPKvwLJtf5N1pwJ6WV7GrYWrq5KxrPT4tns+osU/D+b6+Dyz5a4ZxixV0IwcNIOBAV73COznq4vOKcRBNTMHRFFnLhJFGyiEvUnh378fBw3mq2rbINmgT9Bwfbf19vVCAI7YRwBEQJDIPRMKC1zu9+GvbPworrBPMTk9FyGbCNtEHuEiZ29q9ggesk1eXqhezAFUQM4rmHkKzZk4DJlRQS6qRXrp1k5BM0qAAUOw86+ZDur7i29CQ+UL1zPmQuQUz7QS'
            ,
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
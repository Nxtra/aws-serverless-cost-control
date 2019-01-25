const AWS = require('aws-sdk');
const Lambda = require('./lambda');
const Tag = require('./tag');
const Cloudwatch = require('./cloudwatch');
const Pricing = require('./pricing');

const REGION = 'eu-west-1';
const US_REGION = 'us-east-1';
const cloudwatchClient = new Cloudwatch(new AWS.CloudWatch({ apiVersion: '2010-08-01', region: REGION }));
const tagClient = new Tag(new AWS.ResourceGroupsTaggingAPI({ apiVersion: '2017-01-26', region: REGION }));
const lambdaClient = new Lambda(new AWS.Lambda({ apiVersion: '2015-03-31', region: REGION }), cloudwatchClient);
const pricingClient = new Pricing(new AWS.Pricing({ apiVersion: '2017-10-15', region: US_REGION }));

module.exports = {
    CLOUDWATCH: cloudwatchClient,
    TAG: tagClient,
    LAMBDA: lambdaClient,
    PRICING: pricingClient,
};

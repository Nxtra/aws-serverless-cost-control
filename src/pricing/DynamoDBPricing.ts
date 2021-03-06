import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { window } from '../config';
import { DynamoDBDimension } from '../dimension';
import { PricingResult, ProductPricing } from '../types';
import { Pricing } from './Pricing';

export class DynamoDBPricing extends Pricing {
    private _writeRequestsPrice: number;
    private _readRequestsPrice: number;
    private _monthlyStoragePrice: number;

    public get writeRequestsPrice(): number {
        return this._writeRequestsPrice;
    }

    public get readRequestsPrice(): number {
        return this._readRequestsPrice;
    }

    public get monthlyStoragePrice(): number {
        return this._monthlyStoragePrice;
    }

    public async init(): Promise<DynamoDBPricing> {
        const requestPricing: ProductPricing[] = await this.pricingClient.getProducts({
            filters: [
                { field: 'productFamily', value: 'Amazon DynamoDB PayPerRequest Throughput' },
            ],
            region: this.region,
            serviceCode: 'AmazonDynamoDB',
        });

        const storagePricing: ProductPricing[] = await this.pricingClient.getProducts({
            filters: [
                { field: 'productFamily', value: 'Database Storage' },
                { field: 'volumeType', value: 'Amazon DynamoDB - Indexed DataStore' },
            ],
            region: this.region,
            serviceCode: 'AmazonDynamoDB',
        });


        if (!requestPricing) { return this; }
        this._pricing = requestPricing;
        this._writeRequestsPrice = this.getPricePerUnit('WriteRequestUnits');
        this._readRequestsPrice = this.getPricePerUnit('ReadRequestUnits');

        if (!storagePricing) { return this; }
        this._pricing = [...this._pricing, ...storagePricing];
        this._monthlyStoragePrice = this.getPricePerUnit('GB-Mo');

        return this;
    }

    public calculateForDimension(dimension: DynamoDBDimension): PricingResult {
        // by default, cost window is one minute and metric window 5 minutes
        const metricWindowMinutes = differenceInMinutes(dimension.end, dimension.start);
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / metricWindowMinutes;

        // read and write CU's are averaged
        const readCostPerMinute = dimension.readCapacityUnits * this._readRequestsPrice;
        const writeCostPerMinute = dimension.writeCapacityUnits * this._writeRequestsPrice;
        const storageCost = ((dimension.storageSizeBytes + dimension.writeCapacityUnits * 4 * 1000) / (10 ** 9)) * this._monthlyStoragePrice / window.MONTHLY / 60;
        const totalCost = writeCostPerMinute + readCostPerMinute + storageCost;

        return {
            breakdown: {
                readRequestCharges: readCostPerMinute,
                storageCharges: storageCost,
                writeRequestCharges: writeCostPerMinute,
            },
            currency: this.currency,
            estimatedMonthlyCharge: DynamoDBPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCost,
            totalCostWindowSeconds: costWindowSeconds,
        };
    }
}

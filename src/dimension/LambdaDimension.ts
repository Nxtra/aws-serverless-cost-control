import { lambdaClient } from '../clients';
import { log } from '../logger';
import { Dimension } from './Dimension';

export class LambdaDimension extends Dimension {
    private _averageDuration: number = 0;

    private _memory: number = null;

    private _dataTransferOutInternetGb: number = 0;

    private _dataTransferOutIntraRegionGb: number = 0;

    private _dataTransferOutInterRegionsGb: number = 0;

    private _toRegion: string = '';

    private _requestCount: number;

    public async create(): Promise<LambdaDimension> {
        this._requestCount = await lambdaClient.calculateLambdaInvocations(this.resource, this.start, this.end);
        this._averageDuration = await lambdaClient.calculateLambdaDuration(this.resource, this.start, this.end);
        this._memory = await lambdaClient.getMemory(this.resource);

        log.info(
            'Executions for Lambda function %s: %d - Memory: %dMb - Avg Duration: %dms',
            this.resource.id, this._requestCount, this._memory, this._averageDuration,
        );

        return this;
    }

    public set averageDuration(value: number) {
        this._averageDuration = value;
    }

    public get averageDuration(): number {
        return this._averageDuration;
    }

    public set memory(value: number) {
        this._memory = value;
    }

    public get memory(): number {
        return this._memory;
    }

    public set requestCount(value: number) {
        this._requestCount = value;
    }

    public get requestCount(): number {
        return this._requestCount;
    }

    public get dataTransferOutInternetGb(): number {
        return this._dataTransferOutInternetGb;
    }

    public get dataTransferOutIntraRegionGb(): number {
        return this._dataTransferOutIntraRegionGb;
    }

    public get dataTransferOutInterRegionsGb(): number {
        return this._dataTransferOutInterRegionsGb;
    }

    public get toRegion(): string {
        return this._toRegion;
    }
}

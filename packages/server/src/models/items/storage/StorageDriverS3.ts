import { CustomError, CustomErrorCode } from '../../../utils/errors';
import { StorageDriverConfig, StorageDriverType } from '../../../utils/types';
import StorageDriverBase from './StorageDriverBase';
import { Operator } from "opendal";

export default class StorageDriverS3 extends StorageDriverBase {

	private client_: Operator;

	public constructor(id: number, config: StorageDriverConfig) {
		super(id, { type: StorageDriverType.S3, ...config });
		this.client_ = new Operator("s3", {
			bucket: config.bucket,
			endpoint: config.endpoint || 's3.amazonaws.com',
			region: config.region,
			access_key_id: config.accessKeyId,
			secret_access_key: config.secretAccessKeyId,
		});
	}

	public async write(itemId: string, content: Buffer): Promise<void> {
		await this.client_.write(itemId, content);
	}

	public async read(itemId: string): Promise<Buffer | null> {
		try {
			return await this.client_.read(itemId);
		} catch (error) {
			if (error.message.startsWith("NotFound")) throw new CustomError(`No such item: ${itemId}`, CustomErrorCode.NotFound);
			error.message = `Could not get item "${itemId}": ${error.message}`;
			throw error;
		}
	}

	public async delete(itemId: string | string[]): Promise<void> {
		const itemIds = Array.isArray(itemId) ? itemId : [itemId];
		await this.client_.remove(itemIds);
	}

	public async exists(itemId: string): Promise<boolean> {
		try {
			return await this.client_.isExist(itemId);
		} catch (error) {
			if (error?.$metadata?.httpStatusCode === 404) return false;
			error.message = `Could not check if object exists: "${itemId}": ${error.message}`;
			throw error;
		}
	}

}

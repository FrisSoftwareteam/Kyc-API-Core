import path from 'path';
import * as mongoose from 'mongoose';
import * as csvParse from 'csv-parse';
import axios from 'axios';
import { format } from 'date-fns';
import { writeToBuffer, writeToPath } from '@fast-csv/format';
import logger from '../core/Logger';
import { TaskIdentity, CompletedStatus } from '../constants';

const {
  Types: { ObjectId },
} = mongoose;

export default class CommonLogic {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static hasObjectAnyKeys(object: Record<string, any>) {
    return Object.keys(object || {}).length > 0;
  }

  static isNullOrEmpty(variable: unknown) {
    return !(typeof variable !== 'undefined' && variable !== null && variable !== '');
  }

  static isObject(variable: unknown) {
    return (
      variable instanceof Object &&
      !(variable instanceof Array) &&
      !(variable instanceof Function) &&
      !(variable instanceof Date) &&
      !(variable instanceof ObjectId)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static convertObjectToMongoUpdateObject(obj: Record<string, any>, keyPrefix?: string) {
    let returnObj: {
      [key: string]: string;
    } = {};

    if (!this.isObject(obj)) {
      return obj;
    }

    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const field in obj) {
      const fieldToAdd = obj[field];

      const key = keyPrefix ? `${keyPrefix}.${field}` : field;

      if (this.isObject(fieldToAdd)) {
        const objectField = this.convertObjectToMongoUpdateObject(fieldToAdd, key);

        returnObj = {
          ...returnObj,
          ...objectField,
        };

        // eslint-disable-next-line no-continue
        continue;
      }

      returnObj[key] = fieldToAdd;
    }

    return returnObj;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static removeNullValuesFromObject(obj: Record<string, any>) {
    const returnObj: {
      [key: string]: string;
    } = {};

    if (!this.isObject(obj)) {
      return obj;
    }

    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const field in obj) {
      let fieldToAdd = obj[field];

      if (this.isNullOrEmpty(fieldToAdd)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (this.isObject(fieldToAdd)) {
        fieldToAdd = this.removeNullValuesFromObject(fieldToAdd);
      }

      if (Array.isArray(fieldToAdd)) {
        fieldToAdd = fieldToAdd.map((element) => this.removeNullValuesFromObject(element));
      }

      returnObj[field] = fieldToAdd;
    }

    return returnObj;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static extractNullValuesFromObject(obj: Record<string, any>, keyPrefix = '') {
    let returnObj: Record<string, unknown> = {};

    if (!this.isObject(obj)) {
      return obj;
    }

    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const field in obj) {
      let fieldToAdd = obj[field];

      const key = keyPrefix ? `${keyPrefix}.${field}` : field;

      if (fieldToAdd === null || fieldToAdd === '') {
        returnObj[key] = 1;

        // eslint-disable-next-line no-continue
        continue;
      }

      if (this.isObject(obj[field])) {
        fieldToAdd = this.extractNullValuesFromObject(fieldToAdd, key);

        returnObj = {
          ...returnObj,
          ...fieldToAdd,
        };
      }
    }

    return returnObj;
  }

  static getSetAndUnsetDataForDbUpdate(obj: Record<string, unknown>): {
    setData: Record<string, unknown>;
    unsetData: Record<string, unknown>;
  } {
    const mongoUpdateObj = CommonLogic.convertObjectToMongoUpdateObject(obj);

    const setData = CommonLogic.removeNullValuesFromObject(mongoUpdateObj);

    const unsetData = CommonLogic.extractNullValuesFromObject(mongoUpdateObj);

    return {
      setData,
      unsetData,
    };
  }

  static extractValuesFromCsv(url: string, delimiter?: string): Promise<Record<string, unknown>[]> {
    // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-unused-vars
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(url);

        await csvParse.parse(
          response.data,
          {
            columns: true,
            skip_empty_lines: true,
            delimiter: delimiter || ',',
          },
          async (error, data) => {
            if (error) {
              logger.error(JSON.stringify(error));
              return;
            }
            resolve(data);
          },
        );
      } catch (error) {
        logger.error(JSON.stringify(error));
      }
    });
  }

  static isEmptyObject(obj: Record<string, unknown>): boolean {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  static removeEmptyObjects(arr: Record<string, unknown>[]): Record<string, unknown>[] {
    return arr.filter((obj) => !CommonLogic.isEmptyObject(obj));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static prepareAddressCsvData(addresses: any) {
    const data = [
      {
        candidate: 'CandidateName',
        phoneNumber: 'phoneNumber',
        address: 'Address',
        position: 'Address Position',
        status: 'Status',
        images: 'Images',
        notes: 'Notes',
        submissionAt: 'Submission Point',
        gateColor: 'Gate Color',
        buildingType: 'Buildong Type',
        closesLandmark: 'Closest Landmark',
        buildingColor: 'Building Color',
      },
    ];

    for (const address of addresses) {
      data.push({
        candidate: `${address.candidate[0].lastName} ${address.candidate[0].firstName}`,
        phoneNumber: address?.candidate[0]?.phoneNumber,
        address: address.formatAddress || '',
        position: `${address?.position?.latitude || 'N/A'},${
          address?.position?.longitude || 'N/A'
        }`,
        status: address?.status,
        images: address?.images?.join(','),
        notes: address?.notes?.join(','),
        submissionAt: `${address?.submissionLocation?.latitude || 'N/A'},${
          address?.submissionLocation?.longitude || 'N/A'
        }`,
        gateColor: address?.agentReports?.gateColor,
        buildingType: address?.agentReports?.buildingType,
        closesLandmark: address?.agentReports?.closesLandmark,
        buildingColor: address?.agentReports?.buildingColor,
      });
    }

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static prepareVerificationCsvData(tasks: any) {
    const data = [
      {
        id: 'ID',
        business: 'Business Name',
        candidate: 'CandidateName',
        verificationType: 'Verification Type',
        status: 'Status',
        cost: 'Amount Charge',
        createdAt: 'Date Created',
      },
    ];

    for (const task of tasks) {
      data.push({
        id: task?._id,
        business: task?.business[0]?.name,
        candidate: `${task?.candidate[0]?.lastName} ${task?.candidate[0]?.firstName}` || 'N/A',
        verificationType: task?.verifications?.join(','),
        status: task?.status,
        cost: task?.cost,
        createdAt: format(task?.createdAt, 'do-MMMM-yyyy hh:mm:ssbbb'),
      });
    }

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static prepareDuplicatedIdentityCsvData(records: any) {
    const data = [
      {
        firstName: 'firstName',
        lastName: 'lastName',
        phoneNumber: 'phoneNumber',
        dateOfBirth: 'dateOfBirth',
        identityNumber: 'identityNumber',
        identityType: 'identityType',
      },
    ];

    for (const record of records) {
      data.push({
        firstName: record?.firstName,
        lastName: record?.lastName,
        phoneNumber: record?.phoneNumber,
        dateOfBirth: record?.dateOfBirth,
        identityNumber: record?.identityNumber,
        identityType: record?.identityType,
      });
    }

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static prepareDuplicatedAddressCsvData(records: any) {
    const data = [
      {
        firstName: 'firstName',
        lastName: 'lastName',
        phoneNumber: 'phoneNumber',
        dateOfBirth: 'dateOfBirth',
        identityNumber: 'identityNumber',
        addressBuildingNumber: 'addressBuildingNumber',
        addressStreet: 'addressStreet',
        addressLga: 'addressLga',
        addressState: 'addressState',
      },
    ];

    for (const record of records) {
      data.push({
        firstName: record?.firstName,
        lastName: record?.lastName,
        phoneNumber: record?.phoneNumber,
        dateOfBirth: record?.dateOfBirth,
        identityNumber: record?.identityNumber,
        addressBuildingNumber: record?.addressBuildingNumber,
        addressStreet: record?.addressStreet,
        addressLga: record?.addressLga,
        addressState: record?.addressState,
      });
    }

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async writeDataToCsvReturnBuffer(data: any): Promise<Buffer> {
    const csvBuffer = await writeToBuffer(data);

    return csvBuffer;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async writeDataToCsvReturnPath(data: any): Promise<any> {
    const csvBuffer = await writeToPath(path.resolve(__dirname, 'tmp.csv'), data);

    return csvBuffer;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async allTaskCompleted(task: any): Promise<boolean> {
    for (const taskType of Object.values(TaskIdentity)) {
      if (
        task[taskType] &&
        [CompletedStatus.VERIFIED, CompletedStatus.FAILED].includes(task[taskType]?.status)
      ) {
        return true;
      }
    }

    return false;
  }
}

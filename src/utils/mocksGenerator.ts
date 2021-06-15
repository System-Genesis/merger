import * as faker from 'faker';
import { myModel } from './models';

const generateConstPersons = () => {
    myModel.insertMany([
        {
            firstName: 'a',
            lastNmae: 'b',
            rank: '',
            clearance: '',
            sex: '',
            personalNumber: '',
            identityCard: '012',
            dischargeDay: '',
            unitName: '',
            serviceType: '',
            mobilePhone: '',
            birthdate: '',
            address: '',
            mail: '',
            job: '',
            hierarchy: '',
        },
        {
            firstName: 'c',
            lastNmae: 'd',
            rank: '',
            clearance: '',
            sex: '',
            personalNumber: '',
            identityCard: '123',
            dischargeDay: '',
            unitName: '',
            serviceType: '',
            mobilePhone: '',
            birthdate: '',
            address: '',
            mail: '',
            job: '',
            hierarchy: '',
        },
        {
            firstName: 'e',
            lastNmae: 'f',
            rank: '',
            clearance: '',
            sex: '',
            personalNumber: '',
            identityCard: '456',
            dischargeDay: '',
            unitName: '',
            serviceType: '',
            mobilePhone: '',
            birthdate: '',
            address: '',
            mail: '',
            job: '',
            hierarchy: '',
        },
        {
            firstName: 'h',
            lastNmae: 'g',
            rank: '',
            clearance: '',
            sex: '',
            personalNumber: '',
            identityCard: '789',
            dischargeDay: '',
            unitName: '',
            serviceType: '',
            mobilePhone: '',
            birthdate: '',
            address: '',
            mail: '',
            job: '',
            hierarchy: '',
        },
        {
            firstName: 'h',
            lastNmae: 'i',
            rank: '',
            clearance: '',
            sex: '',
            personalNumber: '',
            identityCard: '147',
            dischargeDay: '',
            unitName: '',
            serviceType: '',
            mobilePhone: '',
            birthdate: '',
            address: '',
            mail: '',
            job: '',
            hierarchy: '',
        },
    ]);
};

const generateRandomPersonsOnCommend = async () => {
    const randomFirstName = faker.name.firstName();
    const randomLastName = faker.name.lastName();
    const randomId = faker.datatype.number();

    return myModel.create({
        firstName: randomFirstName,
        lastName: randomLastName,
        id: randomId,
    });
};

export { generateConstPersons, generateRandomPersonsOnCommend };

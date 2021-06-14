import * as faker from 'faker';
import { myModel } from './models';

const generateConstPersons = () => {
    myModel.insertMany([
        {
            firstName: 'hagai',
            lastNmae: 'millot',
            rank: '',
            clearance: '',
            sex: '',
            personalNumber: '',
            identityCard: '206975377',
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
            firstName: 'elad',
            lastNmae: 'birran',
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
            firstName: 'noam',
            lastNmae: 'shilony',
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
            firstName: 'eli',
            lastNmae: 'kovner',
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
            firstName: 'menachem',
            lastNmae: 'leibman',
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

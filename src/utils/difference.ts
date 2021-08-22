import { transform, isEqual, isObject } from 'lodash';

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
// eslint-disable-next-line import/prefer-default-export
export function difference(object, base) {
    return transform(object, (result: any, value, key) => {
        if (!isEqual(value, base[key])) {
            // eslint-disable-next-line no-param-reassign
            result[key] = isObject(value) && isObject(base[key]) ? difference(value, base[key]) : value;
        }
    });
}

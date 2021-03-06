import { defaults, isArray, isUndefined, isFunction, castArray } from 'lodash';

/**
 * Helps building the metadata of @see Entity
 * <code>{
 *      mandatory: true,    // either mandatory or not
 *      group: "default",  // the group this field is stored
 *      name: "id",        // name of the field in the database 
 *      description: "<TODO: add description>" // description
 *  } </code>
 * @param options for the entity decorator
 */
export function EntityField(options) : any {
    
    return function(target: any, key: string) : any {
        
        if (isUndefined(target.metadata)) {
            Object.defineProperty(target, 'metadata', { 
                configurable: true,
                enumerable: true,
                value: {},
                writable: true
             } );
        }
        target.metadata[key] = validateOptions(options);

        // property getter
        const getter = function (): any {
            return this.getValue(key);
        };

        // Delete property.
        if (delete target[key]) {

            // Create new property with getter and setter
            Object.defineProperty(target, key, {
                get: getter,
                enumerable: true,
                configurable: false
            });
        }
    }
}

let d = {
    // either mandatory or not
    mandatory: false,
    // description
    description: "<TODO: add description>"
}

function validateOptions(options) : any {

    defaults(options, d);

    if (options.mandatory && options.group != "default") {
        throw new Error("internal - mandatory fields must be in default bucket");
    }


    if (!isUndefined(options.search_by)) {
        if (!isFunction(options.search_by) && !isArray(options.search_by)) {
            throw new Error("internal - search by needs to be a function or array of functions");
        }
        options.search_by = castArray(options.search_by);
    }

    return options;
}
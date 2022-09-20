/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect', 'N/url'],
/**
 * @param{record} record
 * @param{redirect} redirect
 * @param{url} url
 */
function(record, redirect, url) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }


    function createMultipleRir(scriptContext) {
            alert('Hello World')

    }

    return {
        pageInit: pageInit,

        saveRecord: createMultipleRir
    };
    
});

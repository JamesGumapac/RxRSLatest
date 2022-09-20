/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/url'],
/**
 * @param{currentRecord} currentRecord
 */
function(currentRecord, record, url) {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(context) {
        var rec = context.currentRecord;
        log.debug('Rec ', rec)
        var status = rec.getValue('custrecord_kod_mr_status')
        log.debug('Status', status)
        if(status == 9){
            if(rec.getValue('customform') != 119 ){
                log.debug('Setting Custom Form Value')
                rec.setValue({fieldId: 'customform', value: 119})
                if(rec.getValue('custrecord_kd_ready_for_approval') !== true){
                    alert('Please select and edit the Return Request and enter a reject reason that you want to adjust.')
                }
            }
        }

    }
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }
    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(context) {

    }
    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }
    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }
    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }
    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }
    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }
    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }
    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }
	function generateFinalStatement(scriptContext){
        //alert('redirecting');
        var suiteletURL = url.resolveScript({
            scriptId: 'customscript_kd_sl_gen_final_statement',
            deploymentId: 'customdeploy_kd_sl_gen_final_statement',
            returnExternalUrl: false,
            params: {
                'custscript_kd_mrr_id': currentRecord.get().id,
            }
        });
        location.href = suiteletURL;
    }
    function approve(){
        var suiteletURL = url.resolveScript({
            scriptId: 'customscript_kd_sl_gen_final_statement',
            deploymentId: 'customdeploy_kd_sl_gen_final_statement',
            returnExternalUrl: false,
            params: {
                'custscript_kd_mrr_id': currentRecord.get().id,
            }
        });
        location.href = suiteletURL;
        /*record.submitFields({
            type: 'customrecord_kod_masterreturn',
            id: currentRecord.get().id,
            values: {
                'custrecord_kod_mr_status': 10
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields : true
            }
        });

        redirect.toRecord({
            type: 'customrecord_kod_masterreturn',
            id: currentRecord.get().id
        });*/
    }
    return {
        pageInit: pageInit,
        generateFinalStatement: generateFinalStatement,
        approve: approve
    };
});

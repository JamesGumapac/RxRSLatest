/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/https', 'N/runtime'],
/**
* @param{record} record
*/
(record, https, runtime) => {
    /**
     * Defines the function definition that is executed before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
     * @since 2015.2
     */
    const beforeLoad = (context) => {

    }

    /**
     * Defines the function definition that is executed before record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const beforeSubmit = (context) => {
        // var cmId;
        //
        // var rrRec = record.load({
        //     type: 'customsale_kod_returnrequest',
        //     id: returnRequestId
        // })
        // var creditmemoSearchObj = search.create({
        //     type: "creditmemo",
        //     filters:
        //         [
        //             ["type","anyof","CustCred"],
        //             "AND",
        //             ["custbody_kd_return_request","anyof",returnRequestId],
        //             "AND",
        //             ["mainline","is","T"]
        //         ]
        // });
        // log.debug('creditmemoSearchObj ', JSON.stringify(creditmemoSearchObj))
        // var searchResultCount = creditmemoSearchObj.runPaged().count;
        // log.debug("creditmemoSearchObj result count",searchResultCount);
        // creditmemoSearchObj.run().each(function(result){
        //     cmId = result.id;
        //
        //     return true;
        // });
        // log.debug('CM ID', cmId)
        // if(cmId){
        //     rrRec.setValue({fieldId: 'custbody_kd_credit_memo_link', value: cmId})
        // }
        // rrRec.save({
        //     ignoreMandatoryFields: true
        // })

    }

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (context) => {
        var rec = context.newRecord;
        log.debug('Rec ',rec)
        if(rec){
            var rrId = rec.getValue('custrecord_kod_packrtn_rtnrequest')
            log.debug('RR Id ', rrId)
            if(rrId){
                var rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: rrId
                })
                var rrId2 = rrRec.save({
                    ignoreMandatoryFields: true
                })
                log.debug('RRID 2', rrId2)
            }
        }

        if (context.type == context.UserEventType.CREATE){
            var objNewRec = context.newRecord;
            var recType = objNewRec.type;
            var url = "https://aiworksdev.agiline.com/global/index?globalurlid=07640CE7-E9BA-4931-BB84-5AB74842AC99&param1=ship";
            
            url = url + "&param2=" + context.newRecord.id;

            var env = runtime.envType;
            if(env === runtime.EnvType.SANDBOX){
                env = 'SANDB';
            }else if(env === runtime.EnvType.PRODUCTION){
                env = 'PROD';
            }
            url = url + "&param3=" + env + "&param4=CREATE";

            log.debug('DEBUG', url);
            https.get({
                url: url
            });

            /*log.debug({
                title: "Server Response Headers",
                details: response.headers
            });*/
        }
    }

    return {beforeLoad, beforeSubmit, afterSubmit}

});
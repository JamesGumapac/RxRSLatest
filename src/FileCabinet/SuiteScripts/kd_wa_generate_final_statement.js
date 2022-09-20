/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(['N/search', 'N/email', 'N/url', 'N/runtime', 'N/redirect'],
function(search, email, url, runtime, redirect) {
    function onAction(scriptContext){
        log.debug({
            title: 'Start Script'
        });

        /*var suiteletURL = url.resolveScript({
            scriptId: 'customscript_kd_sl_gen_final_statement',
            deploymentId: 'customdeploy_kd_sl_gen_final_statement',
            returnExternalUrl: false,
            params: {
                'custscript_kd_mrr_id': currentRecord.get().id,
            }
        });*/
        //location.href = suiteletURL;
        redirect.toSuitelet({
            scriptId: '630',
            deploymentId: '882',
            parameters: {
                'custscript_kd_mrr_id': scriptContext.newRecord.id
            }
        });
        return;
    }

    return {
        onAction: onAction
    }
});
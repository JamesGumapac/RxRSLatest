/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

//CONSTS Declaration

define(['N/ui/serverWidget','N/task', 'N/search', 'N/redirect', 'N/render', 'N/file', 'N/https', 'N/runtime', 'N/record'],
    function (serverWidget,task, search, redirect, render, file, https, runtime, record) {
        function onRequest(context) {
            var objResponse = context.response;
            if (context.request.method == 'GET') {
                var form = serverWidget.createForm({
                    title: 'Return Request Form',
                    hideNavBar: false
                });
                form.addFieldGroup({
                    id: 'custpage_available_main',
                    label: 'Primary Information'
                });
                form.addFieldGroup({
                    id: 'custpage_available_rxotc',
                    label: 'Rx/OTC'
                });
                form.addFieldGroup({
                    id: 'custpage_available_c3_5',
                    label: 'Cat 3-5'
                });
                form.addFieldGroup({
                    id: 'custpage_available_c2',
                    label: 'Cat 2'
                });
                form.addFieldGroup({
                    id: 'custpage_available_file',
                    label: 'File'
                });



                var requestedDate = form.addField({
                    id: 'custpage_kod_mr_requestd',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date Requested',
                    container: 'custpage_available_main'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                })
                var customer = form.addField({
                    id: 'custpage_customer',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Customer Name',
                    source: 'customer',
                    container: 'custpage_available_main'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                })


            form.clientScriptFileId = 18416;
                var rxotc = form.addField({
                    id: 'custpage_rxotc',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Rx/OTC',
                    container: 'custpage_available_rxotc'
                });
                var rxotcNumOfLabels = form.addField({
                    id: 'custpage_kd_mrr_rx_otc_no_labels',
                    type: serverWidget.FieldType.TEXT,
                    label: 'RX/OTC NO. OF LABELS',
                    container: 'custpage_available_rxotc'
                });

                var rxotcPickUpDate = form.addField({
                    id: 'custpage_kd_mrr_rx_otc_pickup_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'RX/OTC PICKUP DATE',
                    container: 'custpage_available_rxotc'
                });
                var c3_5 = form.addField({
                    id: 'custpage_c3_5',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Cat C3 - 5',
                    container: 'custpage_available_c3_5'
                });
                var c3_5NumOfLabels = form.addField({
                    id: 'custpage_kd_mrr_c3_5_no_labels',
                    type: serverWidget.FieldType.TEXT,
                    label: 'C3-5  NO. OF LABELS',
                    container: 'custpage_available_c3_5'
                });

                var c3_5PickUpDate = form.addField({
                    id: 'custpage_kd_mrr_c3_5_pickup_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'C3-5 PICKUP DATE',
                    container: 'custpage_available_c3_5'
                });

                var c2 = form.addField({
                    id: 'custpage_c2',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Cat 2',
                    container: 'custpage_available_c2'
                });
                var c2_NumOfLabels = form.addField({
                    id: 'custpage_kd_mrr_c2_no_labels',
                    type: serverWidget.FieldType.TEXT,
                    label: 'C2  NO. OF LABELS',
                    container: 'custpage_available_c2'
                });

                var c2_PickUpDate = form.addField({
                    id: 'custpage_kd_mrr_c2_pickup_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'C3-5 PICKUP DATE',
                    container: 'custpage_available_c2'
                });
                var fileDash = form.addField({
                    id: 'custpage_filedash',
                    type: serverWidget.FieldType.TEXT,
                    label: '  ',
                    container: 'custpage_available_file'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                })

                var rxotcFile = form.addField({
                    id: 'custpage_rxotc_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'Rx/OTC File',
                });

                var c3_5File = form.addField({
                    id: 'custpage_c3_5_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'Cat 3-5 File'
                });
                var c2_File = form.addField({
                    id: 'custpage_c2_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'Cat 2 File'
                });





                form.addButton({
                    id: 'custpage_previous',
                    label: 'Submit Return',
                    functionName: 'submitReturnRequest()'
                });

                context.response.writePage(form);


                if (context.request.parameters.searchFilter) {
                    // try {
                    //
                    //     var objectToProcess = context.request.parameters
                    //     log.audit(' filters', JSON.stringify(objectToProcess))
                    //
                    //     var yearVal = objectToProcess.yearVal
                    //     var month = objectToProcess.month;
                    //     var property = objectToProcess.property
                    //     var year = objectToProcess.year
                    //     var location = objectToProcess.location
                    //     var myTask = task.create({
                    //         taskType: task.TaskType.SCHEDULED_SCRIPT,
                    //         scriptId: 'customscript_ats_ss_generate_mis_report',
                    //         deploymentId: 'customdeploy_ats_ss_generate_mis_report',
                    //         params:  {
                    //             'custscript_property': property,
                    //             'custscript_month' : month,
                    //             'custscript_year' : year,
                    //             'custscript_yearval' : yearVal,
                    //             'custscript_location' : location
                    //
                    //         }
                    //     })
                    //     var objTaskId = myTask.submit();
                    //
                    //     context.response("PROCESSED");
                    //     return context.response("PROCESSED");
                    // } catch (e) {
                    //     if (e.name == 'SCHEDULED_SCRIPT_ALREADY_RUNNING') {
                    //         return "PROCESSEDFAILED";
                    //     }
                    // }


                }


            }

        }






        return {
            onRequest: onRequest
        };


    }
);
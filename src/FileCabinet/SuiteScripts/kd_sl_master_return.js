/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget'],
    function(serverWidget) {
        function onRequest(context) {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Simple Form'
                });


                form.clientScriptFileId = 4940;


                form.addButton({
                    id : 'custpage_button1',
                    label : 'Download CSV Template',
                    functionName: 'customButton'
                });

                var field = form.addField({
                    id: 'custpage_file',
                    type: 'file',
                    label: 'Document'
                });

                form.addSubmitButton({
                    label: 'Submit Button'
                });

                context.response.writePage(form);
            } else {
                var fileObj = context.request.files.custpage_file;
                fileObj.name = 'myOldImageFile';
                fileObj.folder = 808; //replace with own folder ID
                var id = fileObj.save();
            }
        }

        return {
            onRequest: onRequest
        };
    });
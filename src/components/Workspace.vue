<template>
    <v-container >
        <v-row>
            <v-card v-if="files.length > 0">
                <v-card-title>{{ folderName }}.zip</v-card-title>
                <v-card-text>
                    <div v-for="file in files">{{ file.filename }}</div>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click.stop="downloadFiles" block>
                        <v-icon>mdi-download</v-icon>
                        Download
                        <v-tooltip activator="parent" location="start">Download</v-tooltip>
                    </v-btn>
                </v-card-actions>
            </v-card>
            <div v-if="files.length === 0">No files were generated yet</div>
        </v-row>
    </v-container>
</template>
<style></style>
<script>
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
export default {
    props: ['workspace','folderName'],
    computed: {
        files() {
            return Object.entries(this.workspace).map(file => ({ filename: file[0], content: file[1] }))
        }
    },
    methods: {
        async downloadFiles() {
            const zip = new JSZip();
            // Add each file to the ZIP archive
            this.files.forEach(file => {
                zip.file(file.filename, file.content);
            });

            // Generate the ZIP file asynchronously
            const zipContent = await zip.generateAsync({ type: 'blob' });

            // Save and download the ZIP file
            saveAs(zipContent, `${this.folderName}.zip`);
        }
    }
}
</script>
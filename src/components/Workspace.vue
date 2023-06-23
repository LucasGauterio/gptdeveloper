<template>
    <v-container v-if="files.length > 0">
        <v-row>
            <v-card>
                <v-card-title>Workspace</v-card-title>
                <v-card-text>
                    <div v-for="file in files">{{ file.filename }}</div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn icon @click.stop="downloadFiles">
                        <v-icon>mdi-download</v-icon>
                        <v-tooltip activator="parent" location="start">Download</v-tooltip>
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-row>
    </v-container>
</template>
<style></style>
<script>
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
export default {
    props: ['workspace'],
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
            saveAs(zipContent, 'workspace.zip');
        }
    }
}
</script>
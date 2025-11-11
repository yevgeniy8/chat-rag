import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchFiles as fetchFilesApi, removeFile as removeFileApi } from '../api/files';
import { FileRecord } from '../types/api';

export interface FilesState {
  items: FileRecord[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FilesState = {
  items: [],
  isLoading: false,
  error: null
};

export const fetchFiles = createAsyncThunk<FileRecord[]>('files/fetch', async () => {
  return await fetchFilesApi();
});

export const deleteFile = createAsyncThunk<string, string>('files/delete', async (fileId: string) => {
  await removeFileApi(fileId);
  return fileId;
});

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Unable to load files';
      })
      .addCase(deleteFile.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.file_id !== action.payload);
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.error = action.error.message ?? 'Unable to delete file';
      });
  }
});

export const { setError: setFilesError } = filesSlice.actions;

export default filesSlice.reducer;

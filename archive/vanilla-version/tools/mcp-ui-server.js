#!/usr/bin/env node

/**
 * MCP-UI Server for HTML/CSS Component Generation
 * Provides tools for generating reusable HTML/CSS components
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Component templates
const COMPONENT_TEMPLATES = {
  modal: (title, content) => `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    </div>
    <style>
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-content {
        background: white;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #6b7280;
      }
      .modal-close:hover {
        color: #111827;
      }
      .modal-body {
        padding: 20px;
      }
    </style>`,

  card: (title, description, imageUrl) => `
    <div class="card">
      ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="card-image">` : ''}
      <div class="card-content">
        <h3 class="card-title">${title}</h3>
        <p class="card-description">${description}</p>
      </div>
    </div>
    <style>
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.3s;
      }
      .card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .card-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }
      .card-content {
        padding: 16px;
      }
      .card-title {
        margin: 0 0 8px 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .card-description {
        margin: 0;
        color: #6b7280;
        line-height: 1.5;
      }
    </style>`,

  button: (text, variant = 'primary') => {
    const variants = {
      primary: { bg: '#3b82f6', hover: '#2563eb', color: 'white' },
      secondary: { bg: '#6b7280', hover: '#4b5563', color: 'white' },
      success: { bg: '#10b981', hover: '#059669', color: 'white' },
      danger: { bg: '#ef4444', hover: '#dc2626', color: 'white' },
    };
    const style = variants[variant] || variants.primary;

    return `
    <button class="btn btn-${variant}">${text}</button>
    <style>
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .btn-${variant} {
        background-color: ${style.bg};
        color: ${style.color};
      }
      .btn-${variant}:hover {
        background-color: ${style.hover};
      }
    </style>`;
  },

  form: (fields) => {
    const fieldHTML = fields.map(f => `
      <div class="form-group">
        <label for="${f.name}" class="form-label">${f.label}</label>
        <input
          type="${f.type || 'text'}"
          id="${f.name}"
          name="${f.name}"
          class="form-input"
          ${f.required ? 'required' : ''}
          ${f.placeholder ? `placeholder="${f.placeholder}"` : ''}
        >
      </div>
    `).join('');

    return `
    <form class="custom-form">
      ${fieldHTML}
      <button type="submit" class="form-submit">Submit</button>
    </form>
    <style>
      .custom-form {
        max-width: 500px;
        padding: 20px;
      }
      .form-group {
        margin-bottom: 16px;
      }
      .form-label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: #374151;
      }
      .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
      }
      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .form-submit {
        background-color: #3b82f6;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        margin-top: 8px;
      }
      .form-submit:hover {
        background-color: #2563eb;
      }
    </style>`;
  },

  table: (headers, rows) => {
    const headerHTML = headers.map(h => `<th>${h}</th>`).join('');
    const rowsHTML = rows.map(row =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
    <table class="data-table">
      <thead>
        <tr>${headerHTML}</tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
    <style>
      .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }
      .data-table th,
      .data-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      .data-table th {
        background-color: #f9fafb;
        font-weight: 600;
        color: #374151;
      }
      .data-table tr:hover {
        background-color: #f9fafb;
      }
    </style>`;
  },
};

// Create MCP server
const server = new Server(
  {
    name: 'mcp-ui-html-components',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_modal',
        description: 'Generate a modal dialog component with HTML and CSS',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The modal title',
            },
            content: {
              type: 'string',
              description: 'The modal body content (HTML allowed)',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'generate_card',
        description: 'Generate a card component with HTML and CSS',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The card title',
            },
            description: {
              type: 'string',
              description: 'The card description',
            },
            imageUrl: {
              type: 'string',
              description: 'Optional image URL for the card',
            },
          },
          required: ['title', 'description'],
        },
      },
      {
        name: 'generate_button',
        description: 'Generate a button component with HTML and CSS',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The button text',
            },
            variant: {
              type: 'string',
              enum: ['primary', 'secondary', 'success', 'danger'],
              description: 'The button style variant',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'generate_form',
        description: 'Generate a form component with HTML and CSS',
        inputSchema: {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              description: 'Array of form fields',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                  placeholder: { type: 'string' },
                },
                required: ['name', 'label'],
              },
            },
          },
          required: ['fields'],
        },
      },
      {
        name: 'generate_table',
        description: 'Generate a table component with HTML and CSS',
        inputSchema: {
          type: 'object',
          properties: {
            headers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Table column headers',
            },
            rows: {
              type: 'array',
              items: {
                type: 'array',
                items: { type: 'string' },
              },
              description: 'Table rows (array of arrays)',
            },
          },
          required: ['headers', 'rows'],
        },
      },
      {
        name: 'generate_custom_html',
        description: 'Generate custom HTML/CSS component from description',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Natural language description of the component to generate',
            },
          },
          required: ['description'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_modal':
        return {
          content: [
            {
              type: 'text',
              text: COMPONENT_TEMPLATES.modal(args.title, args.content),
            },
          ],
        };

      case 'generate_card':
        return {
          content: [
            {
              type: 'text',
              text: COMPONENT_TEMPLATES.card(args.title, args.description, args.imageUrl),
            },
          ],
        };

      case 'generate_button':
        return {
          content: [
            {
              type: 'text',
              text: COMPONENT_TEMPLATES.button(args.text, args.variant),
            },
          ],
        };

      case 'generate_form':
        return {
          content: [
            {
              type: 'text',
              text: COMPONENT_TEMPLATES.form(args.fields),
            },
          ],
        };

      case 'generate_table':
        return {
          content: [
            {
              type: 'text',
              text: COMPONENT_TEMPLATES.table(args.headers, args.rows),
            },
          ],
        };

      case 'generate_custom_html':
        return {
          content: [
            {
              type: 'text',
              text: `<!-- Generated component based on: ${args.description} -->
<div class="custom-component">
  <p>Custom component generation requires more context. Please use specific component generators (modal, card, button, form, table) or provide more detailed HTML structure requirements.</p>
</div>
<style>
  .custom-component {
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }
</style>`,
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP UI HTML Components server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

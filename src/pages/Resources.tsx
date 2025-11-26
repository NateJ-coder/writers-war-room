import { useState, useEffect, useRef } from 'react';
import { getChatResponse } from '../services/geminiService';
import { Role } from '../types/chatbot';

interface UploadedResource {
  id: string;
  name: string;
  type: 'summary' | 'chapter' | 'spreadsheet' | 'outline' | 'other';
  content: string;
  uploadedAt: number;
}

const Resources = () => {
  const [resources, setResources] = useState<UploadedResource[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedType, setSelectedType] = useState<'summary' | 'chapter' | 'spreadsheet' | 'outline' | 'other'>('summary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resources from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('external-resources');
    if (saved) {
      try {
        setResources(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading resources:', e);
      }
    }
  }, []);

  // Save resources to localStorage
  useEffect(() => {
    localStorage.setItem('external-resources', JSON.stringify(resources));
  }, [resources]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        
        const newResource: UploadedResource = {
          id: `resource-${Date.now()}`,
          name: file.name,
          type: selectedType,
          content: content,
          uploadedAt: Date.now()
        };

        setResources([...resources, newResource]);

        // Process with AI to extract relevant information
        await processResourceWithAI(newResource);
        
        setIsProcessing(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
      setIsProcessing(false);
    }
  };

  const processResourceWithAI = async (resource: UploadedResource) => {
    try {
      let prompt = '';
      
      switch (resource.type) {
        case 'summary':
          prompt = `I'm uploading a book summary. Please extract and update:
1. New characters (with descriptions)
2. New places/locations (with descriptions)
3. Key events (with descriptions)
4. Any plot structure or outline information

Here's the summary:
${resource.content}

Return as JSON with this structure:
{
  "characters": [{"name": "...", "description": "..."}],
  "places": [{"name": "...", "description": "..."}],
  "events": [{"name": "...", "description": "..."}],
  "notes": ["key point 1", "key point 2"]
}`;
          break;
          
        case 'chapter':
          prompt = `I'm uploading a book chapter. Please extract:
1. New characters introduced (with descriptions)
2. New locations mentioned (with descriptions)
3. Major events that occur (with descriptions)

Here's the chapter:
${resource.content}

Return as JSON with the same structure as before.`;
          break;
          
        case 'spreadsheet':
          prompt = `I'm uploading an Excel spreadsheet (as text) with my book outline. Please parse it and extract:
1. Chapter structure and titles
2. Character information
3. Plot points and events
4. Location information

Spreadsheet content:
${resource.content}

Return as JSON with characters, places, events, and outline sections.`;
          break;
          
        case 'outline':
          prompt = `I'm uploading a book outline. Please structure it into:
1. Main sections/acts
2. Chapters within each section
3. Key plot points
4. Characters involved

Outline:
${resource.content}

Return as structured JSON.`;
          break;
          
        default:
          prompt = `Analyze this text and extract any relevant information about characters, places, events, or story structure:\n\n${resource.content}`;
      }

      const response = await getChatResponse([{ role: Role.USER, content: prompt }]);
      
      // Try to parse JSON response
      try {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          
          // Update localStorage with extracted data
          if (extracted.characters && extracted.characters.length > 0) {
            const existing = JSON.parse(localStorage.getItem('characters-data') || '[]');
            const updated = [...existing, ...extracted.characters];
            localStorage.setItem('characters-data', JSON.stringify(updated));
          }
          
          if (extracted.places && extracted.places.length > 0) {
            const existing = JSON.parse(localStorage.getItem('places-data') || '[]');
            const updated = [...existing, ...extracted.places];
            localStorage.setItem('places-data', JSON.stringify(updated));
          }
          
          if (extracted.events && extracted.events.length > 0) {
            const existing = JSON.parse(localStorage.getItem('events-data') || '[]');
            const updated = [...existing, ...extracted.events];
            localStorage.setItem('events-data', JSON.stringify(updated));
          }
          
          // Trigger storage event to update Contents page
          window.dispatchEvent(new Event('storage'));
          
          alert('✅ Resource processed! Contents page has been updated.');
        }
      } catch (parseError) {
        console.error('Could not parse AI response as JSON:', parseError);
        alert('⚠️ Resource uploaded but could not auto-extract data. You can manually review it below.');
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
      alert('⚠️ Resource uploaded but AI processing failed.');
    }
  };

  const deleteResource = (id: string) => {
    if (confirm('Delete this resource?')) {
      setResources(resources.filter(r => r.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'summary': return '📋';
      case 'chapter': return '📖';
      case 'spreadsheet': return '📊';
      case 'outline': return '🗂️';
      default: return '📄';
    }
  };

  return (
    <div className="resources-container">
      <h1>📚 External Resources</h1>
      <p className="subtitle">Upload summaries, chapters, outlines, or Excel files. AI will automatically extract relevant information and update your Contents page.</p>

      <div className="upload-section">
        <div className="upload-controls">
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="type-selector"
          >
            <option value="summary">Book Summary</option>
            <option value="chapter">Chapter Draft</option>
            <option value="spreadsheet">Excel/Spreadsheet</option>
            <option value="outline">Outline Document</option>
            <option value="other">Other</option>
          </select>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="upload-btn"
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Processing...' : '📤 Upload File'}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.md,.doc,.docx"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
        
        <p className="upload-hint">
          Supported formats: .txt, .csv, .md, .doc, .docx
        </p>
      </div>

      <div className="resources-list">
        <h2>Uploaded Resources ({resources.length})</h2>
        
        {resources.length === 0 ? (
          <div className="empty-state">
            <p>No resources uploaded yet. Upload your first file to get started!</p>
          </div>
        ) : (
          <div className="resources-grid">
            {resources.map((resource) => (
              <div key={resource.id} className="resource-card">
                <div className="resource-header">
                  <span className="resource-icon">{getTypeIcon(resource.type)}</span>
                  <h3>{resource.name}</h3>
                  <button 
                    className="delete-resource-btn"
                    onClick={() => deleteResource(resource.id)}
                    title="Delete resource"
                  >
                    ×
                  </button>
                </div>
                
                <div className="resource-meta">
                  <span className="resource-type">{resource.type}</span>
                  <span className="resource-date">
                    {new Date(resource.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="resource-preview">
                  {resource.content.substring(0, 200)}...
                </div>
                
                <button 
                  className="view-full-btn"
                  onClick={() => {
                    const modal = document.createElement('div');
                    modal.className = 'resource-modal';
                    modal.innerHTML = `
                      <div class="modal-content">
                        <div class="modal-header">
                          <h2>${resource.name}</h2>
                          <button onclick="this.closest('.resource-modal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                          <pre>${resource.content}</pre>
                        </div>
                      </div>
                    `;
                    document.body.appendChild(modal);
                  }}
                >
                  View Full Content
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;

'use client';

import { useEffect, useRef } from 'react';
import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import ReportTemplate from './ReportTemplate';

import { EditorState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { stateToHTML } from 'draft-js-export-html';

import dynamic from 'next/dynamic';

// @ts-expect-error - dynamic import
const Editor = dynamic(() => import('react-draft-wysiwyg').then((mod) => mod.Editor), {
  ssr: false,
});

interface Item {
  id: number;
  description: string;
  quantity: number;
  price: number;
  vatRate: number; // Add VAT rate per item
  imageUrl?: string; // Add imageUrl property
}

interface Section {
  id: string;
  title: string;
  items: Item[];
  vatRate: number;
}

interface ProjectDetails {
  projectAddress: string;
  clientName: string;
  email: string;
  phone: string;
  date: string;
  invoiceNumber: string;
  projectDescription: string;
  validity: string;
  headerImages: string[];
  richTextContent: EditorState;
  richTextHTML?: string;
}


interface ProjectDetailsFormProps {
  projectDetails: ProjectDetails;
  setProjectDetails: React.Dispatch<React.SetStateAction<ProjectDetails>>;
}
export interface CalculationResult {
  subtotal: number;
  vatDetails: Record<number, number>;
  total: number;
}

export function calculateSectionTotals(items: Item[]): CalculationResult {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const vatDetails = items.reduce((vatTotals, item) => {
    const itemSubtotal = item.quantity * item.price;
    const vatAmount = itemSubtotal * (item.vatRate / 100);

    if (!vatTotals[item.vatRate]) {
      vatTotals[item.vatRate] = 0;
    }
    vatTotals[item.vatRate] += vatAmount;
    return vatTotals;
  }, {} as Record<number, number>);

  const total = Object.values(vatDetails).reduce((sum, vat) => sum + vat, subtotal);

  return { subtotal, vatDetails, total };
}

const ProjectDetailsForm: React.FC<ProjectDetailsFormProps> = ({
  projectDetails,
  setProjectDetails,
}) => {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          const newImages = [...(projectDetails.headerImages || [])];
          newImages[index] = e.target.result as string;

          setProjectDetails({
            ...projectDetails,
            headerImages: newImages,
          });
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(projectDetails.headerImages || [])];
    newImages[index] = '';
    setProjectDetails({
      ...projectDetails,
      headerImages: newImages,
    });
  };

  // Safeguard against premature state updates
  const handleEditorChange = (editorState: EditorState) => {
    setProjectDetails((prevDetails) => ({
      ...prevDetails,
      richTextContent: editorState,
    }));
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Project Details</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[0, 1].map((index) => (
          <div key={index}>
            <label className="block text-sm font-medium mb-1">Header Image {index + 1}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, index)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
            {projectDetails.headerImages?.[index] && (
              <div className="mt-2 relative">
                <img
                  src={projectDetails.headerImages[index]}
                  alt={`Header ${index + 1}`}
                  className="h-20 object-contain"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                  type="button"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Project Address</label>
          <Input
            value={projectDetails.projectAddress}
            onChange={(e) =>
              setProjectDetails({
                ...projectDetails,
                projectAddress: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <Input
            value={projectDetails.clientName}
            onChange={(e) =>
              setProjectDetails({
                ...projectDetails,
                clientName: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            value={projectDetails.email}
            onChange={(e) => setProjectDetails({ ...projectDetails, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <Input
            value={projectDetails.phone}
            onChange={(e) => setProjectDetails({ ...projectDetails, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input
            value={projectDetails.date}
            onChange={(e) => setProjectDetails({ ...projectDetails, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Invoice Number</label>
          <Input
            value={projectDetails.invoiceNumber}
            onChange={(e) =>
              setProjectDetails({
                ...projectDetails,
                invoiceNumber: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Project Description</label>
          <Input
            value={projectDetails.projectDescription}
            onChange={(e) =>
              setProjectDetails({
                ...projectDetails,
                projectDescription: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Validity</label>
          <Input
            value={projectDetails.validity}
            onChange={(e) => setProjectDetails({ ...projectDetails, validity: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className=" block text-sm font-medium mb-1">Werkzaamheden opgenomen in deze offerte</h3>
        <Editor
          editorState={projectDetails.richTextContent}
          onEditorStateChange={handleEditorChange}
          toolbar={{
            options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'history'],
            inline: {
              options: ['bold', 'italic', 'underline', 'strikethrough'],
            },
            list: { options: ['unordered', 'ordered'] },
            textAlign: { options: ['left', 'center', 'right'] },
            link: { options: ['link'] },
          }}
          editorClassName="border p-2 rounded"
          wrapperClassName="border rounded"
          toolbarClassName="border-b"
        />
      </div>
    </div>
  );
};

export default function InvoiceGenerator() {
  const reportTemplateRef = useRef(null);
  const detachedDivRef = useRef<HTMLDivElement | null>(null);

  const handleGeneratePdf = () => {
    // Ensure we're in a browser environment
    if (typeof window !== 'undefined' && detachedDivRef.current) {
      const doc = new jsPDF({
        format: 'a4',
        unit: 'px',
        orientation: 'p',
      });

      // Create the div if it doesn't exist
      const tempDiv = detachedDivRef.current || document.createElement('div');
      document.body.appendChild(tempDiv);

      doc.html(tempDiv, {
        width: 595,
        // @ts-expect-error - html2canvas options
        height: 842,
        html2canvas: {
          scale: 0.75,
          useCORS: true,
        },
        async callback(doc) {
          await doc.save(`${projectDetails.projectAddress}-${projectDetails.invoiceNumber}.pdf`);
          // Remove the detached div
          document.body.removeChild(tempDiv);
        },
      });
    }
  };

  // Initialize the ref in useEffect to avoid server-side rendering issues
  useEffect(() => {
    detachedDivRef.current = document.createElement('div');
  }, []);

  const [sections, setSections] = useState<Section[]>([
    {
      id: '0.00',
      title: 'Voor het werk geldende voorwaarden uav 2012',
      items: [],
      vatRate: 0,
    },
  ]);

  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    projectAddress: 'Vossiusstraat 39-H, Amsterdam',
    clientName: 'Sanin Saracevic',
    email: 'dotnetguru@gmail.com',
    phone: '+31638787552',
    date: '12-01-2024',
    invoiceNumber: '621',
    projectDescription: 'Totaal renovatie Vossiusstraat 39',
    validity: '14 dagen',
    headerImages: [],
    richTextContent: EditorState.createEmpty(),
  });

  const convertRichTextToHTML = () => {
    return stateToHTML(projectDetails.richTextContent.getCurrentContent());
  };

  const addSection = () => {
    const lastSection = sections[sections.length - 1];
    const newSectionNumber = String(Number(lastSection.id) + 1).padStart(2, '0') + '.00';

    setSections([
      ...sections,
      {
        id: newSectionNumber,
        title: '',
        items: [],
        vatRate: 0,
      },
    ]);
  };

  const addItem = (sectionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: [
              ...section.items,
              {
                id: Date.now(),
                description: '',
                quantity: 0,
                price: 0,
                vatRate: 0,
              },
            ],
          };
        }
        return section;
      })
    );
  };

  const updateItem = (
    sectionId: string,
    itemId: number,
    field: keyof Item,
    value: string | number
  ) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          };
        }
        return section;
      })
    );
  };

  const deleteItem = (sectionId: string, itemId: number) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          };
        }
        return section;
      })
    );
  };
  const handleTableImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string,
    itemId: number
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          setSections((prevSections) =>
            prevSections.map((section) => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  items: section.items.map((item) =>
                    item.id === itemId ? { ...item, imageUrl: e.target?.result as string } : item
                  ),
                };
              }
              return section;
            })
          );
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };

      reader.readAsDataURL(file);
    }
  };

  const calculatedSections = sections.map((section) => ({
    ...section,
    calculations: calculateSectionTotals(section.items),
  }));

  return (
    <div className="max-w-4xl mx-auto p-4 relative">
      <ProjectDetailsForm projectDetails={projectDetails} setProjectDetails={setProjectDetails} />

      {sections.map((section) => {
        const calculateSubtotal = (items: Item[]) =>
          items.reduce((sum, item) => sum + item.quantity * item.price, 0);

        const calculateVAT = (items: Item[]) =>
          items.reduce((vatTotals, item) => {
            const itemSubtotal = item.quantity * item.price;
            const vatAmount = itemSubtotal * (item.vatRate / 100);

            if (!vatTotals[item.vatRate]) {
              vatTotals[item.vatRate] = 0;
            }
            vatTotals[item.vatRate] += vatAmount;
            return vatTotals;
          }, {} as { [key: number]: number });

        const calculateTotal = (items: Item[]) =>
          items.reduce((total, item) => {
            const itemSubtotal = item.quantity * item.price;
            const vatAmount = itemSubtotal * (item.vatRate / 100);
            return total + itemSubtotal + vatAmount;
          }, 0);

        return (
          <div key={section.id} className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Section {section.id}</h3>
            <div className="mb-4">
              <Input
                placeholder="Section Title"
                value={section.title}
                onChange={(e) =>
                  setSections(
                    sections.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s))
                  )
                }
              />
            </div>

            <table className="w-full mb-4">
              <thead>
                <tr>
                  <th className="text-left">Description</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">VAT</th>
                  <th className="text-right">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(section.id, item.id, 'description', e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        className="text-right"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(section.id, item.id, 'quantity', Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        className="text-right"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(section.id, item.id, 'price', Number(e.target.value))
                        }
                      />
                    </td>
                    {/* vat start */}
                    <td>
                      <select
                        value={item.vatRate || 0}
                        onChange={(e) =>
                          updateItem(section.id, item.id, 'vatRate', Number(e.target.value))
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value={0}>0%</option>
                        <option value={9}>9%</option>
                        <option value={21}>21%</option>
                      </select>
                    </td>
                    {/* vat end */}
                    <td className="py-2 text-right">€{(item.quantity * item.price).toFixed(2)}</td>
                    {/* Image Upload */}
                    <td className="py-2 pl-2">
                      {/* Conditionally render the image if item.imageUrl exists */}
                      {item.imageUrl && (
                        <div className="relative inline-block">
                          <img
                            src={item.imageUrl}
                            alt="Uploaded"
                            className="h-10 w-10 object-cover rounded"
                          />
                          <button
                            onClick={() => updateItem(section.id, item.id, 'imageUrl', '')} // Clear the image
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {/* Upload button - only show if no image is uploaded */}
                      {!item.imageUrl && (
                        <label htmlFor={`image-upload-${item.id}`} className="cursor-pointer">
                          <Upload className="h-4 w-4" />
                        </label>
                      )}
                      <input
                        id={`image-upload-${item.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTableImageUpload(e, section.id, item.id)}
                        className="hidden"
                      />
                    </td>
                    {/* Delete button */}
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(section.id, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-right font-medium py-2">
                    Subtotal:
                  </td>
                  <td className="text-right py-2">
                    € {calculateSubtotal(section.items).toFixed(2)}
                  </td>
                  <td></td>
                </tr>

                {Object.entries(calculateVAT(section.items)).map(([vatRate, amount]) => (
                  <tr key={vatRate}>
                    <td colSpan={4} className="text-right font-medium py-1">
                      VAT ({vatRate || 0}%):
                    </td>
                    <td className="text-right py-1">
                      € {isNaN(amount) ? '0.00' : amount.toFixed(2)}
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={4} className="text-right font-medium py-2">
                    Total incl. VAT:
                  </td>
                  <td className="text-right py-2">€ {calculateTotal(section.items).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(section.id)}
              className="mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        );
      })}

      <div className="flex gap-4 mt-6">
        <Button variant="outline" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>

        {/* {console.log(
          "Exporting with data:",
          projectDetails,
          sections,
          calculatedSections
        )} */}
        <Button
          variant="default"
          onClick={() => {
            // console.log("Exporting with data:", projectDetails, sections);
            // Clone into the detached div
            // @ts-expect-error - html2canvas options
            detachedDivRef.current.innerHTML =
              // @ts-expect-error - html2canvas options
              reportTemplateRef.current.innerHTML;
            handleGeneratePdf();
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
      <div ref={reportTemplateRef} className="hidden">
        <ReportTemplate
          // projectDetails={projectDetails}
          projectDetails={{
            ...projectDetails,
            richTextHTML: convertRichTextToHTML(),
          }}
          sections={calculatedSections}
        />
      </div>
    </div>
  );
}

"use client"

import type React from "react"

import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTransactionModal({ open, onOpenChange }: AddTransactionModalProps) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [receipt, setReceipt] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !amount) return

    setLoading(true)
    setIsSubmitting(true)
    let receiptUrl = null

    try {
      if (receipt) {
        setIsUploading(true)
        setUploadProgress(0)
        
        const receiptRef = ref(storage, `receipts/${user.householdId}/${Date.now()}_${receipt.name}`)
        const uploadTask = uploadBytesResumable(receiptRef, receipt)

        // Create a promise to handle the upload
        const uploadPromise = new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(progress)
            },
            (error) => {
              reject(error)
            },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(url)
            }
          )
        })

        try {
          receiptUrl = await uploadPromise
        } catch (error) {
          console.error("Error uploading receipt:", error)
          toast({
            title: "Error uploading receipt",
            description: "The transaction will be saved without the receipt",
            variant: "destructive",
          })
        } finally {
          setIsUploading(false)
        }
      }

      const now = new Date()
      const transaction = {
        userId: user.id,
        userName: user.name,
        householdId: user.householdId!,
        amount: Number.parseFloat(amount),
        note: note.trim() || null,
        receiptUrl: receiptUrl || null,
        timestamp: now.toISOString(),
        month: now.toISOString().slice(0, 7),
      }

      await addDoc(collection(db, "transactions"), transaction)

      toast({
        title: "Transaction added!",
        description: "Your expense has been recorded",
      })

      setAmount("")
      setNote("")
      setReceipt(null)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error adding transaction",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceipt(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>

        <div className="w-full p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Weekly groceries"
                rows={3}
                className="w-full resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt (optional)</Label>
              <div className="flex items-center space-x-2">
                <Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("receipt")?.click()}
                  className="flex-1 w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="truncate">{receipt ? receipt.name : "Upload Receipt"}</span>
                </Button>
              </div>
            </div>

            {(isSubmitting || isUploading) && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center w-[90vw] sm:w-auto max-w-sm">
                  {isUploading ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">Uploading image... {Math.round(uploadProgress)}%</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">Saving transaction...</p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 p-4 sm:p-6 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={loading || isSubmitting || isUploading} className="w-full sm:w-auto">
            {loading ? "Adding..." : isSubmitting || isUploading ? "Saving..." : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

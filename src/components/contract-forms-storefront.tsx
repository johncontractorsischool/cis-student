"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  LockKeyhole,
  Minus,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getCartCount,
  getCartItems,
  getCartTotal,
  getCheckoutUrl,
} from "@/lib/contract-forms/cart";
import type {
  ContractFormProduct,
  ContractFormsCart,
  ContractFormsPayload,
} from "@/lib/contract-forms/types";

const money = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

type LoadState = "loading" | "ready" | "denied" | "error";

export function ContractFormsStorefront() {
  const router = useRouter();
  const productRefs = useRef<Record<string, HTMLElement | null>>({});
  const [products, setProducts] = useState<ContractFormProduct[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [cart, setCart] = useState<ContractFormsCart>({});
  const [selectedProductId, setSelectedProductId] = useState("");
  const [previewProduct, setPreviewProduct] = useState<ContractFormProduct | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    setError("");

    try {
      const response = await fetch("/api/contract-forms", { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: ContractFormsPayload;
        error?: { message?: string };
      };

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 403) {
        setError(payload.error?.message || "Contract Forms access is required.");
        setLoadState("denied");
        return;
      }
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Unable to load Contract Forms.");
      }

      setProducts(payload.data.products);
      setSelectedProductId(payload.data.products[0]?.id || "");
      setLoadState("ready");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load Contract Forms.",
      );
      setLoadState("error");
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  useEffect(() => {
    if (!previewProduct) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewProduct(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewProduct]);

  const cartCount = useMemo(() => getCartCount(cart), [cart]);
  const cartTotal = useMemo(() => getCartTotal(products, cart), [cart, products]);
  const checkoutUrl = useMemo(
    () => getCheckoutUrl(getCartItems(products, cart)),
    [cart, products],
  );

  function changeQuantity(productId: string, amount: number) {
    setCart((current) => {
      const nextQuantity = Math.max(0, (current[productId] || 0) + amount);
      if (!nextQuantity) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: nextQuantity };
    });
  }

  function selectProduct(productId: string) {
    setSelectedProductId(productId);
    window.requestAnimationFrame(() => {
      productRefs.current[productId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function quickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedProductId) changeQuantity(selectedProductId, 1);
  }

  if (loadState === "loading") return <ContractFormsLoading />;
  if (loadState === "denied") return <ContractFormsDenied message={error} />;
  if (loadState === "error") {
    return (
      <div className="contract-forms-page">
        <ContractFormsTopbar />
        <ContractFormsMessage
          action={<button onClick={() => void load()}>Try again</button>}
          message={error}
          title="Contract Forms are unavailable"
        />
      </div>
    );
  }

  return (
    <div className="contract-forms-page">
      <ContractFormsTopbar />

      <main className="contract-forms-main">
        <section className="contract-forms-hero" aria-labelledby="contract-forms-title">
          <span><BriefcaseBusiness aria-hidden="true" /></span>
          <div>
            <p>Contractor business tools</p>
            <h1 id="contract-forms-title">Contract Forms</h1>
            <strong>Professional forms, bundles, and services for your contracting business.</strong>
          </div>
          <small>{products.length} products</small>
        </section>

        <form className="contract-quick-add" onSubmit={quickAdd}>
          <div>
            <label htmlFor="contract-product-select">Quick Add</label>
            <select
              id="contract-product-select"
              value={selectedProductId}
              onChange={(event) => selectProduct(event.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.pickerLabel} — {money.format(product.price)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit"><ShoppingCart aria-hidden="true" />Add</button>
        </form>

        <section className="contract-product-grid" aria-label="Contract Forms catalog">
          {products.map((product, index) => {
            const productQuantity = cart[product.id] || 0;
            return (
              <article
                className="contract-product-card"
                id={`product-${product.id}`}
                key={product.id}
                ref={(node) => { productRefs.current[product.id] = node; }}
              >
                <button
                  className="contract-product-preview"
                  type="button"
                  onClick={() => setPreviewProduct(product)}
                  aria-label={`Enlarge preview of ${product.title}`}
                >
                  <Image
                    src={product.imageUrl}
                    alt={`${product.title} preview`}
                    fill
                    priority={index < 2}
                    sizes="(max-width: 700px) calc(100vw - 42px), (max-width: 1040px) 45vw, 330px"
                  />
                  <span>{product.previewLabel}<ExternalLink aria-hidden="true" /></span>
                </button>

                <div className="contract-product-copy">
                  <div className="contract-product-title-row">
                    <h2>{product.title}</h2>
                    <span>{product.type}</span>
                  </div>
                  {product.description.map((line) => <p key={line}>{line}</p>)}
                  <aside><strong>Important Notice:</strong>{product.notice}</aside>
                  <div className="contract-product-actions">
                    <strong>{money.format(product.price)}</strong>
                    {productQuantity ? (
                      <div className="contract-quantity" aria-label={`Quantity for ${product.title}`}>
                        <button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label={`Remove one ${product.title}`}><Minus aria-hidden="true" /></button>
                        <span aria-live="polite">{productQuantity}</span>
                        <button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Add one more ${product.title}`}><Plus aria-hidden="true" /></button>
                      </div>
                    ) : (
                      <button className="contract-add-button" type="button" onClick={() => changeQuantity(product.id, 1)}><ShoppingCart aria-hidden="true" />Add to Cart</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <aside className="contract-cart-bar" aria-label="Cart summary">
        <span className={cartCount ? "has-items" : ""}><ShoppingCart aria-hidden="true" />{cartCount ? <i>{cartCount}</i> : null}</span>
        <div><small>{cartCount} {cartCount === 1 ? "item" : "items"}</small><strong>{money.format(cartTotal)}</strong></div>
        {checkoutUrl ? (
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">Checkout<ExternalLink aria-hidden="true" /></a>
        ) : (
          <button disabled>Checkout</button>
        )}
      </aside>

      {previewProduct ? (
        <div
          className="contract-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contract-preview-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPreviewProduct(null);
          }}
        >
          <div>
            <header>
              <div><span>Product preview</span><h2 id="contract-preview-title">{previewProduct.title}</h2></div>
              <button autoFocus type="button" onClick={() => setPreviewProduct(null)} aria-label="Close product preview"><X aria-hidden="true" /></button>
            </header>
            <div className="contract-preview-image">
              <Image src={previewProduct.imageUrl} alt={`${previewProduct.title} enlarged preview`} fill sizes="92vw" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContractFormsTopbar() {
  return (
    <header className="contract-forms-topbar">
      <Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" /></Link>
      <div><span>Business tools</span><strong>Contract Forms</strong></div>
      <span>EN</span>
    </header>
  );
}

function ContractFormsLoading() {
  return (
    <div className="contract-forms-page">
      <ContractFormsTopbar />
      <main className="contract-forms-main contract-forms-loading" aria-busy="true">
        <div className="skeleton contract-forms-hero-skeleton" />
        <div className="skeleton contract-forms-quick-skeleton" />
        <div className="contract-forms-loading-grid"><div className="skeleton" /><div className="skeleton" /></div>
      </main>
    </div>
  );
}

function ContractFormsDenied({ message }: { message: string }) {
  return (
    <div className="contract-forms-page">
      <ContractFormsTopbar />
      <ContractFormsMessage
        icon={<LockKeyhole aria-hidden="true" />}
        message={message}
        title="Access Required"
        action={<Link href="/dashboard">Back to dashboard</Link>}
      />
    </div>
  );
}

function ContractFormsMessage({
  action,
  icon = <BriefcaseBusiness aria-hidden="true" />,
  message,
  title,
}: {
  action: React.ReactNode;
  icon?: React.ReactNode;
  message: string;
  title: string;
}) {
  return (
    <main className="contract-forms-message">
      <span>{icon}</span>
      <h1>{title}</h1>
      <p>{message}</p>
      {action}
    </main>
  );
}

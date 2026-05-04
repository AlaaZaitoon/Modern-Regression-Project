"""PDF report generation via reportlab."""
from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

_NAVY = colors.HexColor("#1B2A5E")
_GOLD = colors.HexColor("#C8972B")


def _header_table_style(header_color: colors.Color) -> TableStyle:
    return TableStyle(
        [
            ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), header_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )


def _label_table_style(header_color: colors.Color) -> TableStyle:
    return TableStyle(
        [
            ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), header_color),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )


def build_pdf(payload: dict[str, Any], dataset_filename: str | None = None) -> bytes:
    """Render the final regression report as a PDF byte string.

    `payload` is the dict persisted in the model registry (the same structure
    returned by regression_service.train_ols).
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        title="Smart Regression Report",
    )
    styles = getSampleStyleSheet()
    h1 = styles["Heading1"]
    h2 = styles["Heading2"]
    normal = styles["Normal"]
    small = ParagraphStyle("small", parent=normal, fontSize=9, textColor=colors.grey)

    story: list[Any] = []
    story.append(Paragraph("Smart Regression System &mdash; Model Report", h1))
    story.append(
        Paragraph(
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            small,
        )
    )
    story.append(Spacer(1, 0.4 * cm))

    # --- Model summary ---
    model_type = payload["model_type"]
    model_type_str = model_type.value if hasattr(model_type, "value") else str(model_type)
    summary = [
        ["Model ID", payload["model_id"]],
        ["Dataset ID", payload["dataset_id"]],
        ["Dataset File", dataset_filename or "-"],
        ["Model Type", model_type_str],
        ["X Columns", ", ".join(payload["x_cols"])],
        ["Y Column", payload["y_col"]],
        ["Equation", payload["equation_str"]],
    ]
    story.append(Paragraph("Model Summary", h2))
    t = Table(summary, hAlign="LEFT", colWidths=[4 * cm, 13 * cm])
    t.setStyle(_label_table_style(_NAVY))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    # --- Metrics ---
    m = payload["metrics"]
    story.append(Paragraph("Metrics", h2))
    metric_rows = [
        ["R2", f"{m.r2:.6f}"],
    ]
    if model_type_str != "simple":
        metric_rows.append(["Adjusted R2", f"{m.adj_r2:.6f}"])
        
    metric_rows.extend([
        ["MSE", f"{m.mse:.6f}"],
        ["RMSE", f"{m.rmse:.6f}"],
        ["MAE", f"{m.mae:.6f}"],
        ["SE (estimate)", f"{m.se:.6f}"],
    ])
    t = Table(metric_rows, hAlign="LEFT", colWidths=[4 * cm, 13 * cm])
    t.setStyle(_label_table_style(_GOLD))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    # --- ANOVA ---
    a = payload["anova"]
    story.append(Paragraph("ANOVA", h2))
    anova_rows = [
        ["Source", "SS", "df", "MS", "F", "F crit", "p-value"],
        [
            "Regression",
            f"{a.SSR:.4f}",
            str(a.df_reg),
            f"{a.MSR:.4f}",
            f"{a.F_stat:.4f}",
            f"{a.F_critical:.4f}",
            f"{a.p_value:.6f}",
        ],
        ["Residual", f"{a.SSE:.4f}", str(a.df_res), f"{a.MSE:.4f}", "", "", ""],
        ["Total", f"{a.SST:.4f}", str(a.df_tot), "", "", "", ""],
    ]
    t = Table(anova_rows, hAlign="LEFT")
    t.setStyle(_header_table_style(_NAVY))
    story.append(t)
    story.append(
        Paragraph(
            f"<b>Decision:</b> {a.decision.replace('_', ' ').upper()}", normal
        )
    )
    story.append(Spacer(1, 0.5 * cm))

    # --- Coefficients + t-tests + CIs ---
    story.append(
        Paragraph("Coefficients, t-Tests, and Confidence Intervals", h2)
    )
    rows = [
        ["Variable", "Coef", "Std Err", "t", "p-value", "CI lower", "CI upper", "Sig."]
    ]
    for tt, ci in zip(payload["t_tests"], payload["confidence_intervals"]):
        rows.append(
            [
                tt.variable,
                f"{tt.coefficient:.4f}",
                f"{tt.std_error:.4f}",
                f"{tt.t_stat:.4f}",
                f"{tt.p_value:.4f}",
                f"{ci.lower:.4f}",
                f"{ci.upper:.4f}",
                "Yes" if tt.significant else "No",
            ]
        )
    t = Table(rows, hAlign="LEFT")
    t.setStyle(_header_table_style(_NAVY))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    # --- Feature importance ---
    story.append(Paragraph("Feature Importance", h2))
    fi_rows = [["Variable", "Standardized Coef", "Importance", "Direction"]]
    for f in payload["feature_importance"]:
        fi_rows.append(
            [
                f.variable,
                f"{f.standardized_coef:.4f}",
                f"{f.importance:.4f}",
                f.direction,
            ]
        )
    t = Table(fi_rows, hAlign="LEFT")
    t.setStyle(_header_table_style(_GOLD))
    story.append(t)

    doc.build(story)
    return buf.getvalue()
